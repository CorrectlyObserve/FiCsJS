import { deepEqual, isBlankString } from '../core/helpers'

export default class State<S> {
  readonly #readonly: boolean
  readonly #subscribers: Map<string, (state: S) => void> = new Map()
  #state: S
  #isDestroyed: boolean = false

  constructor(state: S, options?: { readonly: boolean }) {
    this.#state = state
    this.#readonly = options?.readonly ?? false
  }

  #assertAlive(): void {
    if (this.#isDestroyed) throw new Error('This state is destroyed...')
  }

  #assertWritable(): void {
    this.#assertAlive()
    if (this.#readonly) throw new Error('This state is readonly...')
  }

  #normalizeKey(key: string, type: 'subscribe' | 'unsubscribe'): string {
    key = key.trim()

    if (isBlankString(key))
      throw new Error(`The subscriber key "${key}" to ${type} must be a non-empty string...`)

    if (type === 'subscribe' && this.#subscribers.has(key))
      throw new Error(`The subscriber key "${key}" is already registered...`)

    if (type === 'unsubscribe' && !this.#subscribers.has(key))
      throw new Error(`The subscriber key "${key}" is not found...`)

    return key
  }

  get(): S {
    this.#assertAlive()

    if (states.has(this.#key)) return states.get(this.#key) as S
    throw new Error(`The "${this.#key}" is not defined in states...`)
  }

  set(value: S): void {
    this.#assertAlive()

    if (!writableStates.has(this.#key)) throw new Error(`The "${this.#key}" is readonly...`)

    if (deepEqual(states.get(this.#key), value)) return

    states.set(this.#key, value)

    for (const [key, subscriber] of Array.from(this.#subscribers))
      try {
        subscriber()
      } catch (error) {
        console.error(
          `The subscriber "${key}" of state "${this.#key}" threw during notification...`,
          error
        )
      }
  }

  subscribe(key: string, callback: (state: S) => void): void {
    this.#assertAlive()

    if (!writableStates.has(this.#key)) throw new Error(`The "${this.#key}" is readonly...`)

    key = key.trim()
    if (isBlankString(key)) throw new Error('The "key" to subscribe must be a non-empty string...')

    if (this.#subscribers.has(key))
      throw new Error(`The subscriber key "${key}" is already registered...`)

    this.#subscribers.set(key, () => callback(states.get(this.#key) as S))
  }

  unsubscribe(key?: string): void {
    this.#assertAlive()

    if (key) {
      key = key.trim()
      if (isBlankString(key))
        throw new Error('The "key" to unsubscribe must be a non-empty string...')

      if (!this.#subscribers.has(key))
        throw new Error(`The subscriber key "${key}" was not found...`)

      this.#subscribers.delete(key)
    } else if (this.#subscribers.size > 0) this.#subscribers.clear()
    else throw new Error(`The state "${this.#key}" does not have subscribers...`)
  }

  destroy(): void {
    if (this.#isDestroyed) return

    this.#isDestroyed = true
    this.#subscribers.clear()

    /** @remarks Detaches the state reference to prevent memory leaks. */
    this.#state = undefined as unknown as S
  }
}
