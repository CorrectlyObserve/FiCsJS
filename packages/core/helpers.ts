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
  checkType(param, 'object') && Reflect.ownKeys(param).length === 0

export const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined'

export const numberError = (
  numbers: Record<string, number | undefined>,
  isOnlyPositive: boolean = true
): void => {
  for (const [key, value] of Object.entries(numbers)) {
    if (checkType(value, 'undefined')) continue

    if (!Number.isFinite(value)) throw new Error(`The ${key} must be a number...`)

    if ((isOnlyPositive && value <= 0) || (!isOnlyPositive && value < 0))
      throw new Error(
        `The ${key} must be a ${isOnlyPositive ? 'positive' : 'non-negative'} number...`
      )
  }
}

export const toArray = <T>(param: SingleOrArray<T>): T[] => {
  if (Array.isArray(param)) return [...param]

  const isPlain: boolean =
    checkType(param, 'object') && Object.prototype.toString.call(param) === '[object Object]'
  return isPlain ? [{ ...param }] : [param]
}

export function* uid(): Generator<number> {
  let n: number = 1

  while (true) {
    yield n
    n++
  }
}
