import { PROTO } from './constants'

/** @remarks Prevents prototype pollution from JSON with "__proto__". */
export const setOwnKey = <T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K]
): void => {
  if ((key as PropertyKey) === PROTO)
    Object.defineProperty(target, key, {
      value,
      enumerable: true,
      writable: true,
      configurable: true
    })
  else target[key] = value
}
