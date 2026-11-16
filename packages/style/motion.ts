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

/**
 * @remarks
 * Defaults for motion durations, overridable via --fics-motion-<token> and --fics-easing.
 *
 * - fast: 0.1s ease-out
 * - normal: 0.2s ease-out
 * - slow: 0.4s ease-out
 */
export const motion = (token: keyof typeof MOTIONS = 'normal'): string => MOTIONS[token]
