const generate = function* (): Generator<number> {
  let n = 1

  while (true) {
    yield n
    n++
  }
}

const generator: Generator<number> = generate()

export default generator
