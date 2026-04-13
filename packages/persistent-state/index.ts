import PersistentState from './state'
import type { Options } from './type'

/**
 * @param options.backoff.maxRetry Must be a non-negative integer. Default is `10`.
 * @param options.backoff.interval Must be a non-negative integer. Default is `100`.
 * @param options.backoff.multiplier Must be a non-negative number. Default is `1.5`.
 * @param options.backoff.maxDelay Must be a non-negative integer. Default is `30_000`.
 * @param options.backoff.jitter Must be a positive integer. Default is `100`.
 */
export default <S>(value: S, options?: Options): PersistentState<S> =>
  new PersistentState(value, options)
