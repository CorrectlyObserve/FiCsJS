export const getChildNodes = (element: string): Array<ChildNode> =>
  Array.from(
    new DOMParser().parseFromString(element, 'text/html').body.childNodes
  )

export const cloneNode = (shadowRoot: ShadowRoot, element: string): void => {
  for (const child of getChildNodes(element)) {
    shadowRoot.appendChild(child.cloneNode(true))
  }
}

export const manageError = (error: Error | string | unknown): void => {
  if (error instanceof Error) {
    throw Error(error.message)
  } else if (typeof error === 'string') {
    throw Error(error)
  } else {
    throw Error('unexpected error...')
  }
}

export const toKebabCase = (str: string): string => {
  const newStr = str.slice(1)
  const upperCase = new RegExp(/[A-Z]/g)

  return `${str[0].toLowerCase()}${
    upperCase.test(newStr)
      ? newStr.replace(upperCase, (val) => `-${val.toLowerCase()}`)
      : newStr
  }`
}
