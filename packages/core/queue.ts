import { throwWindowError } from './helpers'
import type { Queue } from './types'

const ficsIds: Record<string, true> = {}
const getQueueId = (queue: Queue, key?: Queue['key']): string =>
  `${queue.ficsId}-${key ?? queue.key}`

const dequeue = (queue: Queue): void => {
  if (queue.key === 'fetch' && !ficsIds[getQueueId(queue, 'define')])
    setTimeout(() => enqueue(queue), 0)
  else queue.func()

  if (queue.key !== 'define') delete ficsIds[getQueueId(queue)]
}

const queues: Queue[] = new Array()
let isProcessing: boolean = false

export const processQueue = (): void => {

  if (queues.length > 0 && !isProcessing) {
    isProcessing = true

    while (queues.length > 0) {
      const queue: Queue = queues.shift()!

      if (queue.key === 're-render') {
        if (!ficsIds[getQueueId(queue, 'define')]) continue
        setTimeout(() => dequeue(queue), 0)
      } else dequeue(queue)
    }

    isProcessing = false
  }
}

export const enqueue = (queue: Queue): void => {
  const queueId: string = getQueueId(queue)

  if (!ficsIds[queueId]) {
    ficsIds[queueId] = true
    queues.push(queue)

    if (typeof document !== 'undefined') processQueue()
  }
}

export const initQueue = (): void => {
  throwWindowError()
  if (typeof document === 'undefined') throw new Error('document is not defined...')

  document.readyState === 'loading'
    ? window.addEventListener('DOMContentLoaded', processQueue, { once: true })
    : processQueue()
}
