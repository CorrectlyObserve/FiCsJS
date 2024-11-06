import { generateUid } from '../core/helpers'
import { Descendant } from '../core/types'

const generator: Generator<number> = generateUid()
const uneditableStates: Map<string, unknown> = new Map()
const states: Map<string, unknown> = new Map()
const syncs: Map<string, Map<Descendant, Set<string>>> = new Map()
const observers: Map<string, () => void> = new Map()

export const createState = <S>(value: S, isReadonly: boolean = false): string => {
  const key: string = `state-${generator.next().value}`

  isReadonly ? uneditableStates.set(key, value) : states.set(key, value)
  return key
}

export const getState = <S>(key: string, isReadonly: boolean = false): S => {
  const stateMap: Map<string, unknown> = isReadonly ? uneditableStates : states

  if (stateMap.has(key)) return stateMap.get(key) as S
  throw new Error(`"${key}" is not defined in states...`)
}

export const setState = <S>(key: string, value: S): void => {
  states.set(key, value)

  if (syncs.has(key))
    for (const [fics, keys] of syncs.get(key)!)
      for (const dataKey of keys) fics.setData(dataKey, value)

  if (observers.has(key)) observers.get(key)!()
}

export const subscribeState = (key: string, value: () => void): void => {
  observers.set(key, value)
}

export const syncState = ({
  state,
  data
}: {
  state: string
  data: { fics: Descendant; key: string }[]
}): void => {
  for (const { fics, key } of data) {
    const sync: Map<Descendant, Set<string>> | undefined = syncs.get(state)

    if (!sync) {
      syncs.set(state, new Map([[fics, new Set([key])]]))
      continue
    }

    sync.has(fics) ? sync.get(fics)!.add(key) : sync.set(fics, new Set([key]))
  }
}

export const unsubscribeState = (key: string): void => {
  if (observers.has(key)) observers.delete(key)
  else throw new Error(`"${key}" is not defined in observers...`)
}
