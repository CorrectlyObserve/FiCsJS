export const appendChild = (
  parent: HTMLElement | ShadowRoot,
  children: string
): void => {
  const fragment = document.createDocumentFragment()
  const childNodes: ChildNode[] = Array.from(
    new DOMParser().parseFromString(children, 'text/html').body.childNodes
  )

  for (const child of childNodes) fragment.appendChild(child.cloneNode(true))

  parent?.appendChild(fragment)
}

export const convertType = <T, U>(html: any, data: { [key: string]: T }) =>
  typeof html === 'function' ? <U>html(data) : <U>html

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
