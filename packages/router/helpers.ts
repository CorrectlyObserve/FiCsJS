import { isObject } from '../core/helpers'

export const hasMethod = <T>(value: unknown, key: string): value is T =>
  isObject(value) && typeof (value as { [key]?: unknown })[key] === 'function'

export const isDynamicPath = (path: string): boolean => path.includes(':')

export const prependSlash = (path: string): string => (path.startsWith('/') ? path : `/${path}`)
