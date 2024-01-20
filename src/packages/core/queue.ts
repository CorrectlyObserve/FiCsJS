import { Queue } from './types'

const queue: Queue[] = new Array()
const ids: Record<string, boolean> = {}
let hasQueue: boolean = false

const addQueue = (queueEl: Queue): void => {
  if (!ids[queueEl.ficsId]) {
    queue.push(queueEl)
    ids[queueEl.ficsId] = true

    if (!hasQueue) {
      hasQueue = true

      while (queue.length > 0) {
        const queueEl: Queue = queue.shift()!

        delete ids[queueEl.ficsId]
        queueEl.reRender
      }

      hasQueue = false
    }
  }
}

export default addQueue
