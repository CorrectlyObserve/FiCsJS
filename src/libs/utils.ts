export const getChildNodes = (element: string): ChildNode[] =>
  Array.from(
    new DOMParser().parseFromString(element, 'text/html').body.childNodes
  )

export const cloneNode = (shadowRoot: ShadowRoot, element: string): void => {
  for (const child of getChildNodes(element)) {
    shadowRoot.appendChild(child.cloneNode(true))
  }
}

export const eachKeys = <T>(
  obj: {
    [key: string]: T
  } = {},
  func: (key: string) => void
): void => {
  if (Object.keys(obj).length > 0) {
    Object.keys(obj).forEach((key: string) => func(key))
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
  const initial = str.slice(0, 1).toLowerCase()
  const body = str.slice(1)
  const upperCase = new RegExp(/[A-Z]/g)

  return `${initial}${
    upperCase.test(body)
      ? body.replace(upperCase, (targets) => `-${targets.toLowerCase()}`)
      : body
  }`
}
