import FiCsElement from './class'
import type { Descendant, Sanitized, SingleOrArray, Syntaxes } from './types'

export const convertToArray = <T>(param: SingleOrArray<T>): T[] =>
  Array.isArray(param) ? [...param] : [param && typeof param === 'object' ? { ...param } : param]

export function* generateUid(): Generator<number> {
  let n = 1

  while (true) {
    yield n
    n++
  }
}

export const sanitize = <D extends object, P extends object>(
  param: Descendant | Sanitized<D, P> | '',
  $template: Syntaxes<D, P>['$template']
): Sanitized<D, P> => (param === '' || param instanceof FiCsElement ? $template`${param}` : param)

export const throwWindowError = (): void => {
  if (typeof window === 'undefined') throw new Error('window is not defined...')
}
