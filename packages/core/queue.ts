import type { Queue } from './types'
import { getHasLoaded } from './init'

const ficsIds: Record<string, true> = {}
const queues: Queue[] = new Array()
let isProcessing: boolean = false
const getQueueId = (queue: Queue): string => `${queue.ficsId}-${queue.key}`
const dequeue = (queue: Queue): void => {
  queue.func()
  if (queue.key !== 'define') delete ficsIds[getQueueId(queue)]
}

export default (queue: Queue): void => {
  if (!ficsIds[getQueueId(queue)]) {
    ficsIds[getQueueId(queue)] = true
    queues.push(queue)

    if (getHasLoaded() && !isProcessing) {
      isProcessing = true

      while (queues.length > 0) {
        const queue: Queue = queues.shift()!
        queue.key === 're-render' ? setTimeout(() => dequeue(queue), 0) : dequeue(queue)
      }

      isProcessing = false
    }
  }
}
