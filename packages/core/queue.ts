import type { Queue } from './types'
import throwWindowError from './utils'

const ficsIds: Record<string, boolean> = {}
const queues: Queue[] = new Array()
let hasLoaded: boolean = false
let isProcessing: boolean = false

export const addToQueue = (queue: Queue): void => {
  if (!ficsIds[queue.ficsId]) {
    queues.push(queue)
    ficsIds[queue.ficsId] = true

    if (hasLoaded && !isProcessing) {
      isProcessing = true

      while (queues.length > 0) {
        const { ficsId, func }: Queue = queues.shift()!

        delete ficsIds[ficsId]
        func()
      }

      isProcessing = false
    }
  }
}

export const useClient = () => {
  throwWindowError()
  if (typeof document === 'undefined') throw new Error('document is not defined...')

  const completeLoading = (): void => {
    hasLoaded = true
  }
  const controlEventListener = (type: 'add' | 'remove'): void => {
    window[`${type}EventListener`]('DOMContentLoaded', completeLoading)
  }

  if (document.readyState === 'loading') controlEventListener('add')
  else {
    controlEventListener('remove')
    completeLoading()
  }
}
