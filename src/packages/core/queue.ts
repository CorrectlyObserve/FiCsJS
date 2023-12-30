import { Queue } from './types'

const queue: Queue[] = []
const ids: Record<string, boolean> = {}
let hasQueue: boolean = false

const processQueue = async (): Promise<void> => {
  while (queue.length > 0) {
    const queueEl: Queue = queue.shift()!

    delete ids[queueEl.welyId]
    queueEl.reRender()
  }

  hasQueue = false
}

const addQueue = (queueEl: Queue): void => {
  if (!ids[queueEl.welyId]) {
    queue.push(queueEl)
    ids[queueEl.welyId] = true

    if (!hasQueue) {
      hasQueue = true
      processQueue()
    }
  }
}

export default addQueue
