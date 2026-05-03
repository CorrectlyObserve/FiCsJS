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
    return this.#state
  }

  set(newState: S): void {
    this.#assertWritable()

    if (deepEqual(this.#state, newState)) return

    this.#state = newState

    const errors: Error[] = []
    for (const [key, subscriber] of Array.from(this.#subscribers))
      try {
        subscriber(newState)
      } catch (error) {
        const cause: Error = error instanceof Error ? error : new Error(String(error))

        errors.push(new Error(`The subscriber "${key}" threw during notification...`, { cause }))
      }

    if (errors.length > 0) throw new AggregateError(errors)
  }

  subscribe(key: string, callback: (state: S) => void): void {
    this.#assertWritable()

    this.#subscribers.set(this.#normalizeKey(key, 'subscribe'), callback)
  }

  unsubscribe(key?: string): void {
    this.#assertAlive()

    if (key) this.#subscribers.delete(this.#normalizeKey(key, 'unsubscribe'))
    else if (this.#subscribers.size > 0) this.#subscribers.clear()
    else throw new Error('This state does not have subscribers...')
  }

  destroy(): void {
    if (this.#isDestroyed) return

    this.#isDestroyed = true
    this.#subscribers.clear()

    /** @remarks Detaches the state reference to prevent memory leaks. */
    this.#state = undefined as unknown as S
  }
}
