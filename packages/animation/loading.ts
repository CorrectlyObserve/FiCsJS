import { numberError } from './../core/helpers'

/**
 * @param duration Must be greater than 0. Default is `2`.
 * @param opacity Must be a number between 0 and 1. Default is `0.4`.
 */
export const pulse = (duration = 2, opacity = 0.4) => {
  numberError({ duration, opacity })

  return {
    animation: `pulse ${duration}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
    '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity } }
  } as const
}

/** @param time Must be greater than 0. Default is `1.5`. */
export const spin = (time: number = 1.5) => {
  numberError({ time })

  return {
    animation: `spin ${time}s infinite linear`,
    '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } }
  } as const
}
