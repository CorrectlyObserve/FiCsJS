import type { SingleOrArray } from './types'

export const convertToArray = <T>(param: SingleOrArray<T>): T[] =>
  Array.isArray(param) ? [...param] : [param && typeof param === 'object' ? { ...param } : param]

export const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined'

export const isNumber = (param: number | unknown): param is number => typeof param === 'number'

export const isString = (param: string | unknown): param is string => typeof param === 'string'

export const throwBrowserError = (): void => {
  if (!isBrowser()) throw new Error('Window and document are not available...')
}

export function* uid(): Generator<number> {
  let n: number = 1

  while (true) {
    yield n
    n++
  }
}
