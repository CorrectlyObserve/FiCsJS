const generate = function* (): Generator<number> {
  let i = 1

  while (true) {
    yield i
    i++
  }
}

const generated: Generator<number> = generate()

export const createUniqueId = (): string => `wely-${generated.next().value}`
