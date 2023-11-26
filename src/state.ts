import generate from './generator'

const generator: Generator<number> = generate()

const uneditableStates: Map<string, unknown> = new Map()
const states: Map<string, unknown> = new Map()
const observers: Map<string, () => void> = new Map()

export const createState = <S>(value: S, isReadonly: boolean = false): string => {
  const key: string = `state${generator.next().value}`

  isReadonly ? uneditableStates.set(key, value) : states.set(key, value)

  return key
}

export const getState = (key: string, isReadonly: boolean = false): unknown => {
  const stateMap: Map<string, unknown> = isReadonly ? uneditableStates : states

  if (stateMap.has(key)) return stateMap.get(key)

  throw Error(`${key} not defined in states...`)
}

export const setState = <S>(key: string, value: S): void => {
  states.set(key, value)

  if (observers.has(key)) observers.get(key)?.()
}

export const subscribeState = (key: string, value: () => void): void => {
  observers.set(key, value)
}

export const unsubscribeState = (key: string): void => {
  if (observers.has(key)) observers.delete(key)
  else throw Error(`${key} not defined in observers...`)
}