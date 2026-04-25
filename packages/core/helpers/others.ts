import type { SingleOrArray } from '../types'
import numberError from './numberError'
import { isPlainObject } from './typeCheck'

export const convertStr = (str: string, type: 'kebab' | 'camel'): string => {
  if (type === 'kebab') return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  return str.toLowerCase().replace(/-([a-z])/g, (_, char) => char.toUpperCase())
}

export const joinArray = <T>(arr: T[], isSpaceAdded: boolean = true): string =>
  arr.join(isSpaceAdded ? ' ' : '').trim()

export const normalizePath = (path: string): string =>
  path === '/' ? '/' : path.replace(/\/+$/, '')

export const normalizeRootMargin = (rootMargin?: string | number): string => {
  if (typeof rootMargin === 'number') {
    numberError({ rootMargin }, 'finite')
    return joinArray(new Array(4).fill(`${rootMargin}px`))
  }

  const split: string[] = (rootMargin ?? '').trim().split(/\s+/)
  if (split.length > 4 || !split[0]) return joinArray(new Array(4).fill('0px'))

  const [top, right, bottom, left]: (string | undefined)[] = split

  if (left) return joinArray(split)
  return joinArray(right || bottom ? [top, right!, bottom ?? top, right!] : new Array(4).fill(top))
}

export const toArray = <T>(param: SingleOrArray<T>): T[] => {
  if (Array.isArray(param)) return [...param]

  if (!isPlainObject(param)) return [param]

  const prototype: Object = Object.getPrototypeOf(param)
  if (prototype === Object.prototype || prototype === null) return [{ ...param }]

  return [param]
}

export const typedEntries = <T extends object>(obj: T): [keyof T, T[keyof T]][] =>
  Object.entries(obj) as [keyof T, T[keyof T]][]

export function* uid(): Generator<number> {
  let n: number = 1

  while (true) {
    yield n
    n++
  }
}
