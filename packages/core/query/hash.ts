import { isPlainObject } from '../helpers'
import { hash as h, NEEDS_ESCAPE } from './constants'

const hashWithAncestors = (key: unknown, ancestors: object[]): string => {
  if (typeof key === 'symbol' || typeof key === 'function')
    throw new Error('Symbols and Functions cannot be used as query keys...')

  if (key === undefined) return h.UNDEFINED
  if (key === null) return h.NULL
  if (typeof key === 'boolean') return key ? h.TRUE : h.FALSE
  if (typeof key === 'number') return `${key}`
  if (typeof key === 'bigint') return `${key}n`
  if (typeof key === 'string') return quote(key)

  if (key instanceof Date) return `${h.DATE}${key.getTime()}`
  if (key instanceof RegExp) return `${h.REGEXP}${quote(String(key))}`

  /** @remarks Marks only an ancestor as circular, ensuring [obj, obj] hashes both items in full. */
  if (ancestors.includes(key)) return h.CIRCULAR

  const nextAncestors: object[] = [...ancestors, key]

  if (key instanceof Map)
    return `${h.MAP}[${Array.from(
      key,
      ([mapKey, mapValue]) =>
        `[${hashWithAncestors(mapKey, nextAncestors)},${hashWithAncestors(mapValue, nextAncestors)}]`
    ).join(',')}]`

  /** @remarks Sorts the members, as a Set means the same thing in any insertion order. */
  if (key instanceof Set)
    return `${h.SET}[${Array.from(key, value => hashWithAncestors(value, nextAncestors))
      .sort()
      .join(',')}]`

  /** @remarks Uses Array.from over map, ensuring holes hash the same as undefined. */
  if (Array.isArray(key))
    return `[${Array.from(key, value => hashWithAncestors(value, nextAncestors)).join(',')}]`

  /** @remarks Hashes the toJSON result of class instances like URL, as they have no own keys. */
  if (!isPlainObject(key)) {
    const { toJSON }: { toJSON?: unknown } = key as { toJSON?: unknown }
    if (typeof toJSON === 'function') return hashWithAncestors(toJSON.call(key), nextAncestors)

    /** @remarks Rejects instances like `URLSearchParams` in browsers, as they would all hash to `{}`. */
    if (Object.keys(key).length === 0)
      throw new Error('Objects without toJSON or own keys cannot be used as query keys...')
  }

  /** @remarks Skips undefined properties, as `{ a: 1, b: undefined }` means the same thing as `{ a: 1 }`. */
  const object: Record<string, unknown> = key as Record<string, unknown>

  return `{${Object.keys(object)
    .filter(_key => object[_key] !== undefined)
    .sort()
    .map(_key => `${quote(_key)}:${hashWithAncestors(object[_key], nextAncestors)}`)
    .join(',')}}`
}

/** @remarks Escapes quotes and backslashes, ensuring `['a","b']` and `['a', 'b']` produce different hashes. */
const quote = (value: string): string =>
  NEEDS_ESCAPE.test(value) ? JSON.stringify(value) : `"${value}"`

export const hash = (key: unknown): string => hashWithAncestors(key, [])
