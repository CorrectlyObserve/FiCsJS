import { Queue } from './types'

const queues: Queue[] = new Array()
const ids: Record<string, boolean> = {}
let hasQueue: boolean = false

const addQueue = (queue: Queue): void => {
  if (!ids[queue.ficsId]) {
    queues.push(queue)
    ids[queue.ficsId] = true

    if (!hasQueue) {
      hasQueue = true

      while (queues.length > 0) {
        const queue: Queue = queues.shift()!

        delete ids[queue.ficsId]
        queue.reRender
      }

      hasQueue = false
    }
  }
}

export default addQueue
