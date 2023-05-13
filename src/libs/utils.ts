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
