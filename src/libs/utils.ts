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

export const fetchCss = async (css: string) => {
  if (!css.endsWith('.css'))
    throw new Error('The file does not appear to be a CSS file.')

  try {
    const res = await fetch(css)

    if (res.status === 200) return await res.text()

    throw new Error(`${res.status} ${res.statusText}`)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : error?.toString())
  }
}

export const toKebabCase = (str: string): string => {
  const newStr = str.slice(1)
  const upperCase = new RegExp(/[A-Z]/g)
  const body = upperCase.test(newStr)
    ? newStr.replace(upperCase, val => `-${val.toLowerCase()}`)
    : newStr

  return str[0].toLowerCase() + body
}
