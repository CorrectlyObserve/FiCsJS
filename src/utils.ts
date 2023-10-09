const generate = function* (): Generator<number> {
  let n = 1

  while (true) {
    yield n
    n++
  }
}

export const generator = generate()

export const sanitize = (str: string): string =>
  str.replace(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
