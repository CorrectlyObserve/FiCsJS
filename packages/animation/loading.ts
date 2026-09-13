import { cssObject, numberError } from '../core/helpers'
import { PULSE_OPACITY } from './constants'

/**
 * @param durationSec Must be greater than 0. Defaults to `2`.
 * @param opacity Must be a number between 0 and 1. Defaults to `0.4`.
 */
export const pulse = (durationSec = 2, opacity = 0.4) => {
  numberError({ durationSec }, 'positive')
  numberError({ opacity }, 'ratio')

  return cssObject({
    animation: `pulse ${durationSec}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
    [PULSE_OPACITY]: opacity
  } as const)
}

/** @param durationSec Must be greater than 0. Defaults to `1.5`. */
export const spin = (durationSec: number = 1.5) => {
  numberError({ durationSec }, 'positive')

  return cssObject({ animation: `spin ${durationSec}s infinite linear` } as const)
}
