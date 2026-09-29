import { isBrowser } from './helpers'
import type { Task, TaskEntry } from './types'

let isDraining: boolean = false,
  isDrainingReRenders: boolean = false,
  isBatchOpen: boolean = false

const tasks: Map<string, TaskEntry> = new Map(),
  queue: Task[] = [],
  reRenderQueue: Task[] = [],
  getQueueId = ({ instanceId, key }: Task): string => `${instanceId}-${key}`,
  processTask = async (task: Task): Promise<void> => {
    const id: string = getQueueId(task),
      entry: TaskEntry | undefined = tasks.get(id)
    if (!entry) return

    /** @remarks Sets the state before processing to avoid ignoring a request made during it. */
    entry.state = (task.key === 'define' ? 'defined' : 'processing') as TaskEntry['state']

    try {
      await task.func()
    } catch (error) {
      console.error(
        `The task has the instanceId ${task.instanceId} and the key "${task.key}" failed to process...`,
        error
      )
    } finally {
      const shouldProcessAgain = entry.state === 'processing-requeued'

      if (shouldProcessAgain) entry.state = 'queued'
      else if (entry.state === 'processing') tasks.delete(id)
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

      if (!isBrowser() || document.visibilityState === 'hidden') setTimeout(processBatch)
      else requestAnimationFrame(processBatch)
    })
  }

export const enqueue = (task: Task): void => {
  if (!isBrowser()) return

  const queueId: string = getQueueId(task)

  if (!ids.has(queueId)) {
    ids.add(queueId)
    queue.push(task)
    void drainQueue()
  }
}
