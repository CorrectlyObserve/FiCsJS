import type { Queue } from './types'

const ficsIds: Record<string, boolean> = {}
const queues: Queue[] = new Array()
let isProcessing: boolean = false

const addToQueue = (queue: Queue): void => {
  if (!ficsIds[queue.ficsId]) {
    queues.push(queue)
    ficsIds[queue.ficsId] = true

    if (!isProcessing) {
      isProcessing = true

      while (queues.length > 0) {
        const { ficsId, reRender }: Queue = queues.shift()!

        delete ficsIds[ficsId]
        reRender
      }

      isProcessing = false
    }
  }
}

export default addToQueue
