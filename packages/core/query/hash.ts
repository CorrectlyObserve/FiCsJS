import { constants } from './constants'

const {
  hash: { CIRCULAR, DATE, FALSE, MAP, NULL, SET, TRUE, UNDEFINED }
} = constants

/** @warning DO NOT pass this function directly to `Array.prototype.map` like `array.map(hash)`. */
export const hash = (key: unknown, seen: WeakSet<WeakKey> = new WeakSet()): string => {
  if (typeof key === 'symbol' || typeof key === 'function')
    throw new Error('Symbols and Functions cannot be used as query keys...')

  if (key === undefined) return UNDEFINED
  if (key === null) return NULL
  if (typeof key === 'boolean') return key ? TRUE : FALSE
  if (typeof key === 'number') return `${key}`
  if (typeof key === 'bigint') return `${key}n`
  if (typeof key === 'string') return `"${key}"`

  if (seen.has(key as object)) return CIRCULAR
  seen.add(key as object)

  if (key instanceof Date) return `${DATE}${key.getTime()}`
  if (key instanceof Map) return `${MAP}[${hash([...key.entries()], seen)}]`
  if (key instanceof Set) return `${SET}[${hash([...key.values()], seen)}]`
  if (Array.isArray(key)) return `[${key.map(_key => hash(_key, seen)).join(',')}]`

  return `{${Object.keys(key)
    .sort()
    .map(_key => `${_key}:${hash((key as Record<string, unknown>)[_key], seen)}`)
    .join(',')}}`
}
