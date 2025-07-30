import { isBrowser } from './helpers'
import type { Queue } from './types'

const ids: Map<string, true> = new Map(),
  getQueueId = ({ instanceId, key }: Queue): string => `${instanceId}-${key}`,
  dequeue = (queue: Queue): void => {
    queue.func()
    if (queue.key !== 'define') ids.delete(getQueueId(queue))
  },
  queues: Queue[] = new Array()
let isProcessing: boolean = false

export const enqueue = (queue: Queue): void => {
  const queueId: string = getQueueId(queue)

  if (!ids.has(queueId)) {
    ids.set(queueId, true)
    queues.push(queue)

    if (isBrowser() && queues.length > 0 && !isProcessing) {
      isProcessing = true

      while (queues.length > 0) {
        const queue: Queue = queues.shift()!
        queue.key === 're-render' ? setTimeout(() => dequeue(queue), 0) : dequeue(queue)
      }

      isProcessing = false
    }
  }
}
