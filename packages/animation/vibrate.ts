import { numberError } from '../core/helpers'

const translate3d = (x: number | string) => ({ transform: `translate3d(${x}, 0, 0)` }) as const

export default (duration = 0.4, unit = 2) => {
  numberError({ duration })
  numberError({ unit }, 'positive-int')

  return {
    animation: `vibrate ${duration}s cubic-bezier(0.36, 0.07, 0.19, 0.97) both`,
    '@keyframes vibrate': {
      '10%, 90%': translate3d(`-${unit}px`),
      '20%, 80%': translate3d(`${unit}px`),
      '30%, 50%, 70%': translate3d(`-${unit * 2}px`),
      '40%, 60%': translate3d(`${unit * 2}px`)
    }
  } as const
}
