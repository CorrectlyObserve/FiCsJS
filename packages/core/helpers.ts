import type { SingleOrArray } from './types'

export const convertToArray = <T>(param: SingleOrArray<T>): T[] =>
  Array.isArray(param) ? [...param] : [param && typeof param === 'object' ? { ...param } : param]

export function* generateUid(): Generator<number> {
  let n: number = 1

  while (true) {
    yield n
    n++
  }
}

export const throwWindowError = (): void => {
  if (typeof window === 'undefined') throw new Error('window is not defined in this environment...')
}
