const generate = function* (): Generator<number> {
  let n = 1

  while (true) {
    yield n
    n++
  }
}

export const generator = generate()

export const symbol: symbol = Symbol('html')
