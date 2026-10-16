import { typedFromEntries } from '../core/helpers'
import { toVar } from './others'

const EASING: string = toVar({ name: 'motion', scale: 'easing', value: 'ease-out' }),
  MOTIONS = typedFromEntries(
    (
      [
        ['fast', '0.1s'],
        ['normal', '0.2s'],
        ['slow', '0.4s']
      ] as const
    ).map(
      ([scale, value]) => [scale, `${toVar({ name: 'motion', scale, value })} ${EASING}`] as const
    )
  )

export const motion = (scale: keyof typeof MOTIONS = 'normal'): string => MOTIONS[scale]
