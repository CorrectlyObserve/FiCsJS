import { isBrowser } from './helpers'
import type { Awaitable, Task, TaskEntry } from './types'

let isDraining: boolean = false,
  isDrainingReRenders: boolean = false,
  isBatchOpen: boolean = false,
  processingLoops: Map<string, number> | undefined

const tasks: Map<string, TaskEntry> = new Map(),
  queue: Task[] = [],
  reRenderQueue: Task[] = [],
  getQueueId = ({ instanceId, key }: Task): string => `${instanceId}-${key}`,
  mergeLoops = ({
    target,
    src
  }: {
    target: Map<string, number>
    src: Map<string, number>
  }): void => {
    for (const [id, count] of src) target.set(id, Math.max(target.get(id) ?? 0, count))
  },
  processTask = async (task: Task): Promise<void> => {
    const id: string = getQueueId(task),
      entry: TaskEntry | undefined = tasks.get(id)
    if (!entry) return

    /** @remarks Sets the state before processing to avoid ignoring a request made during it. */
    entry.state = (task.key === 'define' ? 'defined' : 'processing') as TaskEntry['state']

    try {
      /** @remarks Tracks only requests made before the first await, as await breaks the trace. */
      processingLoops = entry.loops
      const processing: Awaitable = task.func()
      processingLoops = undefined

      await processing
    } catch (error) {
      console.error(`The task "${id}" failed in ${task.name}...`, error)
    } finally {
      /** @remarks Clears it in case func throws synchronously, which skips the reset above. */
      processingLoops = undefined

      const shouldProcessAgain: boolean = entry.state === 'processing-requeued'

      if (shouldProcessAgain) entry.state = 'queued'
      else if (entry.state === 'processing') tasks.delete(id)

      if (entry.state === 'defined') entry.loops.clear()
    }
  },
  drainQueue = async (): Promise<void> => {
    if (isDraining || queue.length === 0) return

    isDraining = true

    try {
      while (true) {
        const batch: Task[] = queue.splice(0)
        if (batch.length === 0) break

        for (const task of batch) {
          if (task.key === 're-render') {
            reRenderQueue.push(task)
            continue
          }

          await processTask(task)
        }
      }

      await drainReRendersQueue()
    } finally {
      isDraining = false

      if (queue.length > 0) void drainQueue()
      else if (reRenderQueue.length > 0) void drainReRendersQueue()
    }
  },
  drainReRendersQueue = async (): Promise<void> => {
    if (isDrainingReRenders || reRenderQueue.length === 0) return

    isDrainingReRenders = true
    isBatchOpen = true

    await new Promise<void>(resolve => {
      const processBatch = (): void => {
        isBatchOpen = false

        void Promise.all(reRenderQueue.splice(0).map(processTask)).finally(() => {
          isDrainingReRenders = false
          resolve()
        })
      }

      if (document.visibilityState === 'hidden') setTimeout(processBatch)
      else requestAnimationFrame(processBatch)
    })
  }

export const enqueue = (task: Task): void => {
  if (!isBrowser()) return

  const id: string = getQueueId(task),
    entry: TaskEntry | undefined = tasks.get(id),
    loops: Map<string, number> = new Map(processingLoops)

  /** @remarks Keeps counting a self-request made after await, which processingLoops misses. */
  if (entry?.state === 'processing') mergeLoops({ target: loops, src: entry.loops })

  const loopLength: number = (loops.get(id) ?? 0) + 1
  loops.set(id, loopLength)

  if (entry && entry.state !== 'processing') {
    if (entry.state !== 'defined') mergeLoops({ target: entry.loops, src: loops })
    return
  }

  if (loopLength > task.maxLoopLength) {
    console.error(`The task "${id}" exceeded the loop limit in ${task.name}...`)
    return
  }

  if (entry) {
    entry.state = 'processing-requeued'
    entry.loops = loops
  } else tasks.set(id, { state: 'queued', loops })

  if (task.key === 're-render' && isBatchOpen) {
    reRenderQueue.push(task)
    return
  }

  queue.push(task)
  void drainQueue()
}
