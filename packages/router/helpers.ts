import { isObject } from '../core/helpers'
import { Rpc } from './types'

export const hasMethod = <T>(value: unknown, key: string): value is T =>
  isObject(value) && typeof (value as { [key]?: unknown })[key] === 'function'

export const isBodiless = (method: Rpc.Method | string): method is 'GET' | 'HEAD' =>
  method === 'GET' || isHeadMethod(method)

export const isDynamicPath = (path: string): boolean => path.includes(':')

export const isHeadMethod = (method: Rpc.Method | string): method is 'HEAD' => method === 'HEAD'

export const prependSlash = (path: string): string => (path.startsWith('/') ? path : `/${path}`)
