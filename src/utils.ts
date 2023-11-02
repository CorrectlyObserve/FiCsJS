const generate = function* (): Generator<number> {
  let n = 1

  while (true) {
    yield n
    n++
  }
}

export const generator: Generator<number> = generate()

export const sanitize = (arg: string | unknown): string | unknown =>
  typeof arg === 'string' ? arg.replace(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;')) : arg

export const symbol: symbol = Symbol('html')
