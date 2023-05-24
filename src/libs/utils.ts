import { Html } from '@/libs/types'

export const appendChild = (
  parent: string | ShadowRoot | HTMLElement,
  children: Html | Html[]
): void => {
  const localParent =
    typeof parent === 'string'
      ? document.getElementById(<string>parent)
      : parent

  if (localParent)
    for (let child of convertToArray(children)) {
      if (typeof child === 'string') {
        const childNode: ChildNode = Array.from(
          new DOMParser().parseFromString(child, 'text/html').body.childNodes
        )[0]
        child = <HTMLElement>childNode.cloneNode(true)
      }

      localParent.appendChild(child)
    }
}

export const convertToArray = (val: Html | Html[]) =>
  Array.isArray(val) ? [...val] : [val]

export const toKebabCase = (str: string): string => {
  const newStr = str.slice(1)
  const upperCase = new RegExp(/[A-Z]/g)
  const body = upperCase.test(newStr)
    ? newStr.replace(upperCase, val => `-${val.toLowerCase()}`)
    : newStr

  return str[0].toLowerCase() + body
}
