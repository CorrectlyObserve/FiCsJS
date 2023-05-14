import { Html } from '@/libs/welifyTypes'

export const appendChild = (
  parent: string | ShadowRoot | HTMLElement,
  children: Html
): void => {
  const localParent =
    typeof parent === 'string'
      ? document.getElementById(<string>parent)
      : parent

  if (localParent)
    for (const child of children)
      if (typeof child === 'string') {
        const childNodes: ChildNode[] = Array.from(
          new DOMParser().parseFromString(child, 'text/html').body.childNodes
        )
        localParent.appendChild(childNodes[0].cloneNode(true))
      } else localParent.appendChild(child)
}

export const toKebabCase = (str: string): string => {
  const newStr = str.slice(1)
  const upperCase = new RegExp(/[A-Z]/g)
  const body = upperCase.test(newStr)
    ? newStr.replace(upperCase, val => `-${val.toLowerCase()}`)
    : newStr

  return str[0].toLowerCase() + body
}
