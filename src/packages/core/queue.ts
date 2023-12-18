import Element from './class'

const queue: Element<object, object>[] = []
const ids: string[] = []
let hasQueue: boolean = false

const processQueue = async (): Promise<void> => {
  while (queue.length > 0) {
    const  = queue[0]

    queue.shift()
    ids.shift()
  }

  queue.length > 0 ? await processQueue() : (hasQueue = false)
}

const setQueue = async (: Element<any, any>, Id: string): Promise<void> => {
  if (!ids.includes(Id)) {
    queue.push()
    ids.push(Id)

    if (!hasQueue) {
      hasQueue = true
      await processQueue()
    }
  }
}

export default setQueue
