import { convertToArray, generateUid } from '../core/helpers'
import { Descendant, SingleOrArray } from '../core/types'

const generator: Generator<number> = generateUid()
const states: Map<string, unknown> = new Map()
const writableStates: Set<string> = new Set()
const observers: Map<string, () => void> = new Map()
const syncs: Map<string, Map<Descendant, Set<string>>> = new Map()

export const createState = <S>(value: S, options?: { readonly: boolean }): string => {
  const key: string = `fics-state-${generator.next().value}`
  const { readonly }: { readonly?: boolean } = options ?? {}

  states.set(key, value)
  if (!readonly) writableStates.add(key)

  return key
}

export const getState = <S>(key: string): S => {
  if (states.has(key)) return states.get(key) as S
  throw new Error(`The "${key}" is not defined in states...`)
}

export const setState = <S>(key: string, value: S): void => {
  if (!writableStates.has(key)) throw new Error(`The "${key}" is readonly...`)

  states.set(key, value)

  if (syncs.has(key))
    for (const [fics, keys] of syncs.get(key)!) for (const _key of keys) fics.setData(_key, value)

  if (observers.has(key)) observers.get(key)!()
}

export const subscribeState = (key: string, value: () => void): void => {
  observers.set(key, value)
}

export const unsubscribeState = (key: string): void => {
  if (observers.has(key)) observers.delete(key)
  else throw new Error(`The "${key}" is not defined in observers...`)
}

export const syncState = ({
  state,
  data
}: {
  state: string
  data: SingleOrArray<Record<string, Descendant>>
}): void => {
  for (const datum of convertToArray(data))
    for (const [key, descendant] of Object.entries(datum)) {
      const sync: Map<Descendant, Set<string>> | undefined = syncs.get(state)

      if (!sync) {
        syncs.set(state, new Map([[descendant, new Set([key])]]))
        continue
      }

      sync.has(descendant) ? sync.get(descendant)!.add(key) : sync.set(descendant, new Set([key]))
    }
}
