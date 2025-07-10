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

export const convertStr = (str: string, type: 'kebab' | 'camel'): string => {
  if (type === 'kebab') return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  return str.toLowerCase().replace(/-([a-z])/g, (_, char) => char.toUpperCase())
}

export const isBlankObject = (param: unknown): boolean =>
  checkType(param, 'object') && Object.keys(param).length === 0

export const isBrowser = (): boolean => {
  try {
    return !checkType(window, 'undefined') && !checkType(document, 'undefined')
  } catch (_) {
    return false
  }
}

export const numberError = (number: number, isOnlyPositive: boolean = true): void => {
  if (isNaN(number)) throw new Error(`The number ${number} must be a number...`)

  if (isOnlyPositive && number <= 0)
    throw new Error(`The number ${number} must be a positive number...`)

  if (!isOnlyPositive && number < 0)
    throw new Error(`The number ${number} must be a non-negative number...`)
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
