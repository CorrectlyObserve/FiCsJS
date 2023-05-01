import { Args } from '@/libs/welifyTypes'

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

export const convertType = <T, D, P>(html: any, args: Args<D, P>) =>
  typeof html === 'function' ? <T>html(args) : <T>html

export const fetchCssFile = async (cssFile: string): Promise<string> => {
  if (cssFile.endsWith('.css'))
    try {
      const res = await fetch(cssFile, { method: 'GET' })

      if (res.ok) {
        console.log(res)
        return await res.text()
      }

      throw Error(`${res.status} ${res.statusText}`)
    } catch (error) {
      throw Error(<string>error)
    }
  else throw Error('The file does not appear to be css file.')
}

export const toKebabCase = (str: string): string => {
  const newStr = str.slice(1)
  const upperCase = new RegExp(/[A-Z]/g)
  const body = upperCase.test(newStr)
    ? newStr.replace(upperCase, val => `-${val.toLowerCase()}`)
    : newStr

  return str[0].toLowerCase() + body
}
