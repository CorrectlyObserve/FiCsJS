import { uid } from '../core/helpers'

const generator: Generator<number> = uid(),
  states: Map<string, unknown> = new Map(),
  writableStates: Set<string> = new Set()

export default class State<S> {
  #key: string
  #subscribers: Map<string, () => void> = new Map()
  #isDestroyed = false

  constructor(value: S, options?: { readonly: boolean }) {
    this.#key = `fics-state-${generator.next().value}`
    const { readonly }: { readonly: boolean } = options ?? { readonly: false }

    states.set(this.#key, value)
    if (!options || !readonly) writableStates.add(this.#key)
  }

  #assertAlive(): void {
    if (this.#isDestroyed) throw new Error('This state instance is destroyed...')
  }

  get(): S {
    this.#assertAlive()

    if (states.has(this.#key)) return states.get(this.#key) as S
    throw new Error(`The "${this.#key}" is not defined in states...`)
  }

  set(value: S): void {
    this.#assertAlive()

    if (!writableStates.has(this.#key)) throw new Error(`The "${this.#key}" is readonly...`)

    if (Object.is(states.get(this.#key), value)) return

    states.set(this.#key, value)

    for (const subscriber of Array.from(this.#subscribers.values()))
      try {
        subscriber()
      } catch (error) {
        console.error('The state subscriber threw an error:', error)
      }
  }

  subscribe(key: string, callback: (state: S) => void): void {
    this.#assertAlive()

    if (!writableStates.has(this.#key)) throw new Error(`The "${this.#key}" is readonly...`)

    key = key.trim()
    if (key === '') throw new Error('The "key" to subscribe must be a non-empty string...')

    if (this.#subscribers.has(key))
      throw new Error(`The subscriber key "${key}" is already registered...`)

    this.#subscribers.set(key, () => callback(states.get(this.#key) as S))
  }

  unsubscribe(key?: string): void {
    this.#assertAlive()

    if (key) {
      key = key.trim()
      if (key === '') throw new Error('The "key" to unsubscribe must be a non-empty string...')

      if (!this.#subscribers.has(key))
        throw new Error(`The subscriber key "${key}" is not found...`)

      this.#subscribers.delete(key)
    } else if (this.#subscribers.size > 0) this.#subscribers.clear()
    else throw new Error(`The state "${this.#key}" does not have subscribers...`)
  }

  destroy(): void {
    if (this.#isDestroyed) return

    this.#isDestroyed = true
    this.#subscribers.clear()

    states.delete(this.#key)
    writableStates.delete(this.#key)
  }
}
