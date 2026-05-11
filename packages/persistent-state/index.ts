import PersistentState from './state'
import type { Ctx } from './types'

/**
 * @param options.intervalMs Must be a non-negative integer if it is a number.
 * @param options.maxRetries Must be a non-negative integer if it is a number.
 */
export default <S>({ stateId, state, options }: Ctx<S>): PersistentState<S> =>
  new PersistentState({ stateId, state, options })
