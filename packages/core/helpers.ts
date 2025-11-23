import type { SingleOrArray } from './types'

export const browserError = (): void => {
  if (!isBrowser()) throw new Error('Window and document are not available...')
}

export const convertStr = (str: string, type: 'kebab' | 'camel'): string => {
  if (type === 'kebab') return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  return str.toLowerCase().replace(/-([a-z])/g, (_, char) => char.toUpperCase())
}

export const isBlankObject = (param: unknown): boolean =>
  isObject(param) && Reflect.ownKeys(param).length === 0

export const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined'

export const isObject = (param: unknown): param is Record<string, unknown> =>
  typeof param === 'object' && param !== null && !Array.isArray(param)

export const normalizePath = (path: string): string =>
  path === '/' ? '/' : path.replace(/\/+$/, '')

export const numberError = (
  numbers: Record<string, number | undefined>,
  isPositiveRequired: boolean = true
): void => {
  for (const [key, value] of Object.entries(numbers)) {
    if (value === undefined) continue

    if (!Number.isFinite(value)) throw new Error(`The ${key} must be a number...`)

    if ((isPositiveRequired && value <= 0) || (!isPositiveRequired && value < 0))
      throw new Error(
        `The ${key} must be a ${isPositiveRequired ? 'positive' : 'non-negative'} number...`
      )
  }
}

export const toArray = <T>(param: SingleOrArray<T>): T[] => {
  if (Array.isArray(param)) return [...param]

  const isPlain: boolean =
    isObject(param) && Object.prototype.toString.call(param) === '[object Object]'
  return isPlain ? [{ ...param }] : [param]
}

export function* uid(): Generator<number> {
  let n: number = 1

  while (true) {
    yield n
    n++
  }
}
