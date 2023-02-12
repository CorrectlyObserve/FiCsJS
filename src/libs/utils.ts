export const convertToElements = (prop: string): HTMLElement =>
  new DOMParser().parseFromString(prop, 'text/html').body

export const copyElements = (shadow: ShadowRoot, element: string): void => {
  const children: ChildNode[] = Array.from(
    convertToElements(element).childNodes
  )

  for (const child of children) {
    shadow.appendChild(child.cloneNode(true))
  }
}

export const extractFirstChild = (prop: string): HTMLElement =>
  convertToElements(prop).firstChild as HTMLElement

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
