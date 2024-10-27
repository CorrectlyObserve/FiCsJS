import FiCsElement from './class'
import type { Descendant, Sanitized, SingleOrArray, Syntaxes } from './types'

export const convertToArray = <T>(params: SingleOrArray<T>): T[] =>
  Array.isArray(params)
    ? [...params]
    : [params && typeof params === 'object' ? { ...params } : params]

export const sanitize = <D extends object>(
  param: Descendant | Sanitized<D, {}>,
  $template: Syntaxes<D, {}>['$template']
): Sanitized<D, {}> => (param instanceof FiCsElement ? $template`${param}` : param)
