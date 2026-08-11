import type { SingleOrArray } from '../types'
import { SPECIAL_CHAR } from './constants'
import { numberError } from './numberError'
import { isPlainObject } from './typeCheck'

export const convertStr = (str: string, type: 'kebab' | 'camel'): string => {
  if (type === 'kebab') return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  return str.toLowerCase().replace(/[-_]([a-z])/g, (_, char) => char.toUpperCase())
}

export const escape = (str: string, context: 'attr' | 'text-content' = 'attr'): string => {
  const escaped: string = str.replace(
    /[&<>]/g,
    char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] as string
  )

  if (context === 'text-content') return escaped
  return escaped.replace(/["']/g, char => ({ '"': '&quot;', "'": '&#39;' })[char] as string)
}

export const escapeRegExp = (str: string): string => str.replace(SPECIAL_CHAR, '\\$&')

export const normalizePath = (path: string): string => removeTrailingSlash(path) || '/'

export const normalizeRootMargin = (rootMargin?: string | number): string => {
  if (typeof rootMargin === 'number') {
    numberError({ rootMargin }, 'int')
    return new Array(4).fill(`${rootMargin}px`).join(' ')
  }

  const split: string[] = (rootMargin ?? '').trim().split(/\s+/)
  if (split.length > 4 || !split[0]) return new Array(4).fill('0px').join(' ')

  const [top, right, bottom, left]: (string | undefined)[] = split

  if (left) return split.join(' ')
  return (right || bottom ? [top, right!, bottom ?? top, right!] : new Array(4).fill(top)).join(' ')
}

export const removeTrailingSlash = (path: string): string => path.replace(/\/+$/, '')

export const toArray = <T>(param: SingleOrArray<T>): T[] => {
  if (Array.isArray(param)) return [...param]
  return isPlainObject(param) ? [{ ...param }] : [param]
}

export const toLowerFirst = (str: string): string => str.charAt(0).toLowerCase() + str.slice(1)

export const typedEntries = <T extends object>(obj: T): [keyof T, T[keyof T]][] =>
  Object.entries(obj) as [keyof T, T[keyof T]][]

export function* uid(): Generator<number> {
  let n: number = 1
  while (true) yield n++
}
