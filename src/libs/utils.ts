import { Values } from './welifyTypes'

export const appendChild = (
  parent: HTMLElement | ShadowRoot,
  children: string | HTMLElement[]
): void => {
  const fragment = document.createDocumentFragment()

  if (Array.isArray(children))
    for (const child of children) fragment.appendChild(child.cloneNode(true))
  else {
    const childNodes: ChildNode[] = Array.from(
      new DOMParser().parseFromString(children, 'text/html').body.childNodes
    )

    for (const child of childNodes) fragment.appendChild(child.cloneNode(true))
  }

  parent?.appendChild(fragment)
}

export const convertType = <T, U>(html: any, values: Values<T>) =>
  typeof html === 'function' ? <U>html(values) : <U>html

export const delay = async (
  time: number,
  callback: () => void
): Promise<void> => {
  await new Promise<void>(resolve => setTimeout(resolve, time))
  callback()
}

export const toKebabCase = (str: string): string => {
  const newStr = str.slice(1)
  const upperCase = new RegExp(/[A-Z]/g)
  const body = upperCase.test(newStr)
    ? newStr.replace(upperCase, val => `-${val.toLowerCase()}`)
    : newStr

  return str[0].toLowerCase() + body
}
