import WelyElement from './class'

const queue: WelyElement<object, object>[] = []
const ids: string[] = []
let hasQueue: boolean = false

const processQueue = async (): Promise<void> => {
  while (queue.length > 0) {
    const wely = queue[0]

    queue.shift()
    ids.shift()
  }

  queue.length > 0 ? await processQueue() : (hasQueue = false)
}

const setQueue = async (wely: WelyElement<any, any>, welyId: string): Promise<void> => {
  if (!ids.includes(welyId)) {
    queue.push(wely)
    ids.push(welyId)

    if (!hasQueue) {
      hasQueue = true
      await processQueue()
    }
  }
}

export default setQueue
