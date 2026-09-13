import { cssObject, numberError } from '../core/helpers'
import { VIBRATE_UNIT } from './constants'

/**
 * @param durationSec Must be greater than 0. Defaults to `0.4`.
 * @param unit Must be a positive integer. Defaults to `2`.
 */
export const vibrate = (durationSec = 0.4, unit = 2) => {
  numberError({ durationSec }, 'positive')
  numberError({ unit }, 'positive-int')

  return cssObject({
    animation: `vibrate ${durationSec}s cubic-bezier(0.36, 0.07, 0.19, 0.97) both`,
    [VIBRATE_UNIT]: `${unit}px`
  } as const)
}
