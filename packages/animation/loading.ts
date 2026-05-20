import { numberError } from '../core/helpers'

/**
 * @param durationSec Must be greater than 0. Default is `2`.
 * @param opacity Must be a number between 0 and 1. Default is `0.4`.
 */
export const pulse = (durationSec = 2, opacity = 0.4) => {
  numberError({ durationSec }, 'positive')
  numberError({ opacity }, 'ratio')

  return {
    animation: `pulse ${durationSec}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
    '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity } }
  } as const
}

/** @param durationSec Must be greater than 0. Default is `1.5`. */
export const spin = (durationSec: number = 1.5) => {
  numberError({ durationSec }, 'positive')

  return {
    animation: `spin ${durationSec}s infinite linear`,
    '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } }
  } as const
}
