import type { SingleOrArray } from './types'

export const browserError = (): void => {
  if (!isBrowser()) throw new Error('Window and document are not available...')
}

export const checkType = <
  T extends 'string' | 'number' | 'boolean' | 'function' | 'object' | 'undefined'
>(
  param: unknown,
  type: T
): param is T extends 'string'
  ? string
  : T extends 'number'
    ? number
    : T extends 'boolean'
      ? boolean
      : T extends 'function'
        ? Function
        : T extends 'object'
          ? object
          : T extends 'undefined'
            ? undefined
            : never =>
  type === 'object'
    ? typeof param === 'object' && param !== null && !Array.isArray(param)
    : typeof param === type

export const isBrowser = (): boolean => {
  try {
    return !checkType(window, 'undefined') && !checkType(document, 'undefined')
  } catch (_) {
    return false
  }
}

export const toArray = <T>(param: SingleOrArray<T>): T[] =>
  Array.isArray(param) ? [...param] : [checkType(param, 'object') ? { ...param } : param]

export function* uid(): Generator<number> {
  let n: number = 1

  while (true) {
    yield n
    n++
  }
}
