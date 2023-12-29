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

const addQueue = (func: () => void, Id: string): void => {
  if (!ids.includes(Id)) {
    queue.push(func)
    ids.push(Id)

    if (!hasQueue) {
      hasQueue = true
      processQueue()
    }
  }
}

export default addQueue
