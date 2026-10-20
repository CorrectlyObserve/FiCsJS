import { typedFromEntries } from '../core/helpers'
import { toVar } from './others'

const EASING: string = toVar({ name: 'motion', token: 'easing', value: 'ease-out' }),
  MOTIONS = typedFromEntries(
    (
      [
        ['fast', '0.1s'],
        ['normal', '0.2s'],
        ['slow', '0.4s']
      ] as const
    ).map(
      ([token, value]) => [token, `${toVar({ name: 'motion', token, value })} ${EASING}`] as const
    )
  )

export const motion = (token: keyof typeof MOTIONS = 'normal'): string => MOTIONS[token]
