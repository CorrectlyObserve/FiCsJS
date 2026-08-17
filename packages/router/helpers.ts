import { isObject, normalizePath, typedEntries } from '../core/helpers'
import { Rpc } from './types'

export const findRedirect = (
  path: string,
  prefixes: readonly (readonly [prefix: string, to: string])[]
): string | null => {
  for (const [prefix, to] of prefixes) if (path.startsWith(prefix)) return to
  return null
}

export const flattenRedirects = (map: ReadonlyMap<string, string>): Map<string, string> => {
  const toPurePath = (target: string): string => normalizePath(target.split(/[?#]/)[0]),
    flattened: Map<string, string> = new Map()

  for (const [key, value] of map) {
    const visited: Set<string> = new Set([key])
    let target: string = value,
      next: string = toPurePath(target)

    while (map.has(next)) {
      if (visited.has(next)) throw new Error(`A redirect loop was detected at "${next}"...`)

      visited.add(next)
      target = map.get(next)!
      next = toPurePath(target)
    }

    flattened.set(key, target)
  }

  return flattened
}

export const hasMethod = <T>(value: unknown, key: string): value is T =>
  isObject(value) && typeof (value as { [key]?: unknown })[key] === 'function'

export const isBodiless = (method: Rpc.Method | string): method is 'GET' | 'HEAD' =>
  method === 'GET' || isHeadMethod(method)

export const isDynamicPath = (path: string): boolean => path.includes(':')

export const isHeadMethod = (method: Rpc.Method | string): method is 'HEAD' => method === 'HEAD'

export const parseRedirects = (
  redirects: Record<string, string>
): { exact: Map<string, string>; prefixes: [string, string][] } => {
  const exact: Map<string, string> = new Map(),
    prefixes: [string, string][] = []

  for (const [from, to] of typedEntries(redirects)) {
    const key: string = normalizePath(from)
    key.endsWith('*') ? prefixes.push([key.slice(0, -1), to]) : exact.set(key, to)
  }

  return { exact, prefixes }
}

export const prependSlash = (path: string): string => (path.startsWith('/') ? path : `/${path}`)
