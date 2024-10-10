import type { Queue } from './types'
import { getHasLoaded } from './useClient'

const ficsIds: Record<string, boolean> = {}
const queues: Queue[] = new Array()
let isProcessing: boolean = false

export default (queue: Queue): void => {
  if (!ficsIds[queue.ficsId]) {
    queues.push(queue)
    ficsIds[queue.ficsId] = true

    if (getHasLoaded() && !isProcessing) {
      isProcessing = true

      while (queues.length > 0) {
        const { ficsId, process }: Queue = queues.shift()!

        delete ficsIds[ficsId]
        process()
      }

      isProcessing = false
    }
  }
}