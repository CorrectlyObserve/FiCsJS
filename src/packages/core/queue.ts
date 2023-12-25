const queue: (() => void)[] = []
const ids: string[] = []
let hasQueue: boolean = false

const processQueue = async (): Promise<void> => {
  while (queue.length > 0) {
    const func = queue.shift()!
    ids.shift()

    func()
  }

  // queue.length > 0 ? await processQueue() : (hasQueue = false)
}

const setQueue = async (func: () => void, welyId: string): Promise<void> => {
  if (!ids.includes(welyId)) {
    queue.push(func)
    ids.push(welyId)

    if (!hasQueue) {
      hasQueue = true
      await processQueue()
    }
  }
}

export default setQueue
