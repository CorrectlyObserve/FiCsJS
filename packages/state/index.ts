import { State } from './state'
import type { Options } from './types'

/** @param options.version must be a positive integer if it is a number. */
export const createState = <S>(value: S, options?: Options<S>): State<S> =>
  new State(value, options)
