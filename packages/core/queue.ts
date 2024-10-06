import type { GlobalCss, Queue } from './types'
import throwWindowError from './utils'

const ficsIds: Record<string, boolean> = {}
const queues: Queue[] = new Array()
let hasLoaded: boolean = false
let isProcessing: boolean = false
let css: GlobalCss | undefined = undefined

export const addToQueue = (queue: Queue): void => {
  if (!ficsIds[queue.ficsId]) {
    queues.push(queue)
    ficsIds[queue.ficsId] = true

    if (hasLoaded && !isProcessing) {
      isProcessing = true

      while (queues.length > 0) {
        const { ficsId, func }: Queue = queues.shift()!

        delete ficsIds[ficsId]
        func(css)
      }

      isProcessing = false
    }
  }
}

export const useClient = ({ globalCss }: { globalCss?: GlobalCss } = {}) => {
  throwWindowError()
  if (typeof document === 'undefined') throw new Error('document is not defined...')

  const completeLoading = (): void => {
    hasLoaded = true
    if (globalCss && globalCss.length > 0) css = [...globalCss]
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
