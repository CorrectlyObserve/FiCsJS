const createProxy = <T extends object>(arg: T): T => {
  return new Proxy(arg, {
    get: (target, property, receiver) => {
      return Reflect.get(target, property, receiver)
    },
    set: (target: T, property: string | symbol, value: typeof target) => {
      Reflect.set(target, property, value)
      return true
    }
  })
}

export default createProxy
