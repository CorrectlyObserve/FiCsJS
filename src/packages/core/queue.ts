const queue: (() => void)[] = []
const ids: string[] = []
let hasQueue: boolean = false

const processQueue = async (): Promise<void> => {
  while (queue.length > 0) {
    const func = queue.shift()!
    ids.shift()

    func()
  }

  hasQueue = false
}

const addQueue = (func: () => void, welyId: string): void => {
  if (!ids.includes(welyId)) {
    queue.push(func)
    ids.push(welyId)

    if (!hasQueue) {
      hasQueue = true
      processQueue()
    }
  }
}

export default addQueue
