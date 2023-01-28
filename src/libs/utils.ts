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

export const convertToElements = (props: string): HTMLElement =>
  new DOMParser().parseFromString(props, 'text/html').body

export const manageError = (error: Error | string | unknown): void => {
  if (error instanceof Error) {
    throw Error(error.message)
  } else if (typeof error === 'string') {
    throw Error(error)
  } else {
    throw Error('unexpected error...')
  }
}
