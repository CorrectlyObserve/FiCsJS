import PersistentState from './state'
import type { Options } from './types'

/**
 * @param options.intervalMs Must be a non-negative integer if it is a number.
 * @param options.maxRetries Must be a non-negative integer if it is a number.
 */
export default <S>(value: S, options?: Options): PersistentState<S> =>
  new PersistentState(value, options)
