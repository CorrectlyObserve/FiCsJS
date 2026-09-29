import { isBrowser } from './helpers'
import type { Task, TaskEntry } from './types'

let isDraining: boolean = false,
  isDrainingReRenders: boolean = false,
  isBatchOpen: boolean = false

const tasks: Map<string, TaskEntry> = new Map(),
  queue: Task[] = [],
  reRenderQueue: Task[] = [],
  getQueueId = ({ instanceId, key }: Task): string => `${instanceId}-${key}`,
  report = ({ instanceId, key }: Task, error: unknown): void =>
    console.error(
      `The task has the instanceId ${instanceId} and the key "${key}" failed to process...`,
      error
    ),
  dequeue = async (task: Task): Promise<void> => {
    try {
      await task.func()
    } finally {
      if (task.key !== 'define') ids.delete(getQueueId(task))
    }
  },
  drainQueue = async (): Promise<void> => {
    if (isDraining || queue.length === 0) return

    isDraining = true

    try {
      while (true) {
        const batch: Task[] = queue.splice(0)
        if (batch.length === 0) break

        for (const task of batch)
          if (task.key === 're-render') reRenderQueue.push(task)
          else
            try {
              await dequeue(task)
            } catch (error) {
              const { instanceId, key }: Task = task
              console.error(
                `The task has instanceId ${instanceId} and key "${key}" failed to process...`,
                error
              )
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
