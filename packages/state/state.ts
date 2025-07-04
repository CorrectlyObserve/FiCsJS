import { toArray, uid } from '../core/helpers'
import { Children as Descendants, Descendant, SingleOrArray } from '../core/types'

const generator: Generator<number> = uid()
const states: Map<string, unknown> = new Map()
const writableStates: Set<string> = new Set()
const observers: Map<string, () => void> = new Map()
const syncs: Map<string, Map<Descendant, Set<string>>> = new Map()

export default class State<S> {
  #key: string

  constructor(value: S, options?: { readonly: boolean }) {
    this.#key = `fics-state-${generator.next().value}`
    const { readonly }: { readonly?: boolean } = options ?? {}

    states.set(this.#key, value)
    if (!readonly) writableStates.add(this.#key)
  }

  get(): S {
    if (states.has(this.#key)) return states.get(this.#key) as S
    throw new Error(`The "${this.#key}" is not defined in states...`)
  }

  set(value: S): void {
    if (!writableStates.has(this.#key)) throw new Error(`The "${this.#key}" is readonly...`)
    states.set(this.#key, value)

    if (syncs.has(this.#key))
      for (const [descendant, keys] of syncs.get(this.#key)!)
        for (const key of keys) descendant.setData(key, value)

    if (observers.has(this.#key)) observers.get(this.#key)!()
  }

  subscribe(callback: () => void): void {
    if (observers.has(this.#key)) throw new Error(`The "${this.#key}" is already subscribed...`)
    observers.set(this.#key, callback)
  }

  unsubscribe(): void {
    if (observers.has(this.#key)) observers.delete(this.#key)
    else throw new Error(`The "${this.#key}" is not defined in observers...`)
  }

  sync({
    state,
    descendants
  }: {
    state: string
    descendants: SingleOrArray<Descendants>
  }): void {
    for (const _descendants of toArray(descendants))
      for (const [key, descendant] of Object.entries(_descendants)) {
        const sync: Map<Descendant, Set<string>> | undefined = syncs.get(state)

        if (!sync) {
          syncs.set(state, new Map([[descendant, new Set([key])]]))
          continue
        }

        sync.has(descendant) ? sync.get(descendant)!.add(key) : sync.set(descendant, new Set([key]))
      }
  }
}
