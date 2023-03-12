export const convert = <T>(arg: T | (() => T)): T =>
  typeof arg === 'function' ? (arg as () => T)() : arg

export const getChildNodes = (element: string): Array<ChildNode> =>
  Array.from(
    new DOMParser().parseFromString(element, 'text/html').body.childNodes
  )

export const toKebabCase = (str: string): string => {
  const newStr = str.slice(1)
  const upperCase = new RegExp(/[A-Z]/g)

  return `${str[0].toLowerCase()}${
    upperCase.test(newStr)
      ? newStr.replace(upperCase, (val) => `-${val.toLowerCase()}`)
      : newStr
  }`
}
