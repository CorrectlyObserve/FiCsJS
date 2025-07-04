import { numberError } from './../core/helpers'

export default (time: number) => {
  numberError(time)

  return {
    animation: `spin ${time}s infinite linear`,
    '@keyframes spin': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' }
    }
  } as const
}
