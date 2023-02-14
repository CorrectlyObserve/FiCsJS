export const getChildNodes = (element: string): ChildNode[] =>
  Array.from(
    new DOMParser().parseFromString(element, 'text/html').body.childNodes
  )

export const cloneNode = (shadow: ShadowRoot, element: string): void => {
  for (const child of getChildNodes(element)) {
    shadow.appendChild(child.cloneNode(true))
  }
}

export const keysInObj = <T>(
  obj: {
    [key: string]: T
  } = {}
): {
  is: boolean
  toArray: string[]
} => {
  return {
    is: Object.keys(obj).length > 0,
    toArray: Object.keys(obj),
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
