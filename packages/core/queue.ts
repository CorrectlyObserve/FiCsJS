import { isBrowser } from './helpers'
import type { Task } from './types'

let isProcessing: boolean = false,
  isReRendering: boolean = false

const ids: Set<string> = new Set(),
  queue: Task[] = new Array(),
  reRenderQueue: Task[] = new Array(),
  getQueueId = ({ instanceId, key }: Task): string => `${instanceId}-${key}`,
  dequeue = async (task: Task): Promise<void> => {
    try {
      await task.func()
    } finally {
      if (task.key !== 'define') ids.delete(getQueueId(task))
    }
  },
  drainQueue = (): void => {
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
              dequeue(task)
            } catch {
              const { instanceId, key }: Task = task
              console.error(
                `The task has instanceId ${instanceId} and key "${key}" failed to process...`
              )
            }
      }

      scheduleReRenders()
    } finally {
      isProcessing = false
    }
  },
  scheduleReRenders = (): void => {
    if (isReRendering || reRenderQueue.length === 0) return

    isReRendering = true

    setTimeout(() => {
      try {
        const batch: Task[] = reRenderQueue.splice(0)
        for (const task of batch)
          try {
            dequeue(task)
          } catch {
            console.error(
              `The task has instanceId ${task.instanceId} and key "re-render" failed to process...`
            )
          }
      } finally {
        isReRendering = false
        drainQueue()
        scheduleReRenders()
      }
    })
  }

export default (task: Task): void => {
  if (!isBrowser()) return

  const queueId: string = getQueueId(task)

  if (!ids.has(queueId)) {
    ids.add(queueId)
    queue.push(task)

    drainQueue()
  }
}
