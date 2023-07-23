const generate = function* (): Generator<number> {
  let n = 1

  while (true) {
    yield n
    n++
  }
}

export const generator: Generator<number> = generate()

export const toKebabCase = (str: string): string => {
  const newStr = str.slice(1)
  let body = newStr
  const upperCase = new RegExp(/[A-Z]/g)

  if (upperCase.test(newStr)) body = newStr.replace(upperCase, val => `-${val.toLowerCase()}`)

  return str[0].toLowerCase() + body
}
