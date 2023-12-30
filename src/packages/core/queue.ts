import { Queue } from './types'

const queue: Queue[] = []
const ids: Record<string, boolean> = {}
let hasQueue: boolean = false

const processQueue = async (): Promise<void> => {
  while (queue.length > 0) {
    const queueEl: Queue = queue.shift()!

    delete ids[queueEl.ficsId]
    queueEl.reRender()
  }

  hasQueue = false
}

const addQueue = (queueEl: Queue): void => {
  if (!ids[queueEl.ficsId]) {
    queue.push(queueEl)
    ids[queueEl.ficsId] = true

    if (!hasQueue) {
      hasQueue = true
      processQueue()
    }
  }
}

export default addQueue
