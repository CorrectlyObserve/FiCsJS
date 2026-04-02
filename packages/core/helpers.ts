import type { SingleOrArray } from './types'

export const browserError = (): void => {
  if (!isBrowser()) throw new Error('Window and document are not available...')
}

export const clampRatio = (ratio: number): number => {
  numberError({ ratio }, 'finite')

  if (ratio <= 0) return 0
  if (ratio >= 1) return 1
  return ratio
}

export const convertStr = (str: string, type: 'kebab' | 'camel'): string => {
  if (type === 'kebab') return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  return str.toLowerCase().replace(/-([a-z])/g, (_, char) => char.toUpperCase())
}

/**
 * @remarks
 * - **Map**: Keys are compared by reference. Values are deeply compared.
 * - **Set**: Values are compared deeply and order-independently (Complexity: O(N^2)).
 * - **Error**: Compared by `name` and `message`. The `stack` trace is ignored as it is environment-specific.
 * - **Opaque Objects**: `WeakMap`, `WeakSet`, and `Promise` always return `false` unless they share the same reference.
 *
 * @remarks
 * For change detection, updates should be **immutable**; mutating nested objects can be seen as "no change".
 */
export const deepEqual = (
  current: any,
  newValue: any,
  weakMaps: { current: WeakMap<any, any>; new: WeakMap<any, any> } = {
    current: new WeakMap(),
    new: new WeakMap()
  }
): boolean => {
  if (Object.is(current, newValue)) return true

  if (
    typeof current !== 'object' ||
    current === null ||
    typeof newValue !== 'object' ||
    newValue === null
  )
    return false

  if (current.constructor !== newValue.constructor) return false

  if (weakMaps.current.has(current) || weakMaps.new.has(newValue))
    return weakMaps.current.get(current) === newValue && weakMaps.new.get(newValue) === current

  weakMaps.current.set(current, newValue)
  weakMaps.new.set(newValue, current)

  if (typeof Node !== 'undefined' && current instanceof Node) return current.isEqualNode(newValue)

  if (typeof Window !== 'undefined' && current instanceof Window) return false

  if (current instanceof Date) return current.getTime() === newValue.getTime()
  if (current instanceof RegExp) return current.toString() === newValue.toString()

  if (current instanceof Map) {
    if (current.size !== newValue.size) return false

    for (const [key, val] of current) {
      if (!newValue.has(key)) return false
      if (deepEqual(val, newValue.get(key), weakMaps)) continue
      return false
    }

    return true
  }

  if (current instanceof Set) {
    if (current.size !== newValue.size) return false

    let isSame: boolean = false

    for (const _current of current) {
      if (newValue.has(_current)) continue

      isSame = false
      for (const _new of newValue)
        if (deepEqual(_current, _new, weakMaps)) {
          isSame = true
          break
        }

      if (!isSame) return false
    }

    return true
  }

  if (current instanceof ArrayBuffer || ArrayBuffer.isView(current)) {
    if (current.byteLength !== newValue.byteLength) return false

    const toUint8Array = (arrayBuffer: ArrayBuffer | ArrayBufferView): Uint8Array => {
        if (ArrayBuffer.isView(arrayBuffer))
          return new Uint8Array(arrayBuffer.buffer, arrayBuffer.byteOffset, arrayBuffer.byteLength)

        return new Uint8Array(arrayBuffer)
      },
      currentUint8Array = toUint8Array(current),
      newUint8Array = toUint8Array(newValue)

    for (let i = 0; i < currentUint8Array.length; i++)
      if (currentUint8Array[i] !== newUint8Array[i]) return false

    return true
  }

  if (current instanceof String || current instanceof Number || current instanceof Boolean)
    return current.valueOf() === newValue.valueOf()

  if (current instanceof Error)
    return current.name === newValue.name && current.message === newValue.message

  if (current instanceof WeakMap || current instanceof WeakSet || current instanceof Promise)
    return false

  const keys: (string | symbol)[] = Reflect.ownKeys(current)

  if (keys.length !== Reflect.ownKeys(newValue).length) return false

  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(newValue, key)) return false
    if (!deepEqual(current[key], newValue[key], weakMaps)) return false
  }

  return true
}

export const isBlankString = (param: unknown): boolean =>
  typeof param === 'string' && param.trim() === ''

export const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined'

export const isEmptyObject = (param: unknown): boolean =>
  isPlainObject(param) && Reflect.ownKeys(param).length === 0

export const isPlainObject = (param: unknown): param is Record<string, unknown> =>
  typeof param === 'object' && param !== null && !Array.isArray(param)

export const joinArray = <T>(arr: T[], isSpaceAdded: boolean = true): string =>
  arr.join(isSpaceAdded ? ' ' : '').trim()

export const normalizePath = (path: string): string =>
  path === '/' ? '/' : path.replace(/\/+$/, '')

/**
 * @remarks Ignores undefined values.
 */
export const numberError = (
  numbers: Record<string, number | undefined>,
  condition:
    | 'finite'
    | 'positive'
    | 'positive-int'
    | 'non-negative'
    | 'non-negative-int' = 'positive'
): void => {
  for (const [key, value] of typedEntries(numbers)) {
    if (value === undefined) continue

    if (!Number.isFinite(value)) throw new Error(`The ${key} must be a number...`)
    if (condition === 'finite') continue

    for (const remaining of ['positive', 'non-negative'] as const)
      if (condition.startsWith(remaining)) {
        if (value < 0 || (remaining === 'positive' && value === 0))
          throw new Error(`The ${key} must be a ${remaining} number...`)

        if (condition === `${remaining}-int` && !Number.isInteger(value))
          throw new Error(`The ${key} must be a ${remaining} integer...`)

        continue
      }
  }
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
