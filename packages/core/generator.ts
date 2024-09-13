export default function* (): Generator<number> {
  let n = 1

  while (true) {
    yield n
    n++
  }
}
