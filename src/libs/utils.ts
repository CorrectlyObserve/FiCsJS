export const getChildNodes = (element: string): ChildNode[] =>
  Array.from(
    new DOMParser().parseFromString(element, 'text/html').body.childNodes
  )

export const toKebabCase = (str: string): string => {
  const newStr = str.slice(1)
  const upperCase = new RegExp(/[A-Z]/g)
  const body = upperCase.test(newStr)
    ? newStr.replace(upperCase, (val) => `-${val.toLowerCase()}`)
    : newStr

  return str[0].toLowerCase() + body
}
