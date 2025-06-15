import { isBrowser } from './helpers'
import type { Queue } from './types'

const ids: Record<string, true> = {}
const getQueueId = ({ uniqueId, key }: Queue): string => `${uniqueId}-${key}`

const dequeue = (queue: Queue): void => {
  queue.func()
  if (queue.key !== 'define') delete ids[getQueueId(queue)]
}

const queues: Queue[] = new Array()
let isProcessing: boolean = false

export const enqueue = (queue: Queue): void => {
  const queueId: string = getQueueId(queue)

  if (!ids[queueId]) {
    ids[queueId] = true
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
