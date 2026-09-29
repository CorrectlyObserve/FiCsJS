import { isBrowser } from './helpers'
import type { Task, TaskEntry } from './types'

let isProcessing: boolean = false,
  isReRendering: boolean = false

const queueIds: Set<string> = new Set(),
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
    if (isProcessing || queue.length === 0) return

    isProcessing = true

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
      isProcessing = false

      if (queue.length > 0) void drainQueue()
      else if (reRenderQueue.length > 0) void drainReRendersQueue()
    }
  },
  drainReRendersQueue = async (): Promise<void> => {
    if (isReRendering || reRenderQueue.length === 0) return

    isReRendering = true

    await new Promise<void>(resolve => {
      const run = (): void => {
        const batch: Promise<void>[] = reRenderQueue.splice(0).map(async task => {
          try {
            await dequeue(task)
          } catch (error) {
            report(task, error)
          }
        })

        void Promise.allSettled(batch).finally(() => {
          isReRendering = false
          resolve()
        })
      }

      if (!isBrowser() || document.visibilityState === 'hidden') setTimeout(run)
      else requestAnimationFrame(run)
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
