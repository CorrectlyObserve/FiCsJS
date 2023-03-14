import { Type } from './welifyTypes'

export const convert = <T>(arg: Type<T>): T =>
  typeof arg === 'function' ? (arg as () => T)() : arg

export const getChildNodes = (element: string): ChildNode[] =>
  Array.from(
    new DOMParser().parseFromString(element, 'text/html').body.childNodes
  )

export const toKebabCase = (str: string): string => {
  const head = str[0].toLowerCase()
  const newStr = str.slice(1)
  const upperCase = new RegExp(/[A-Z]/g)

  return (
    head +
    `${
      upperCase.test(newStr)
        ? newStr.replace(upperCase, (val) => `-${val.toLowerCase()}`)
        : newStr
    }`
  )
}
