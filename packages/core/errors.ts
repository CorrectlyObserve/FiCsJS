export const throwDataPropsError = <T extends object, P>(
  object: T,
  key: keyof T,
  tagName: string
): void => {
  if (!(key in object))
    throw new Error(
      `"${key as string}" is not defined in ${(object as object as P) ? 'props' : 'data'} of ${tagName}...`
    )
}

export const throwWindowError = (): void => {
  if (typeof window === 'undefined') throw new Error('window is not defined...')
}
