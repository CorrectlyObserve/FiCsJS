import { typedFromEntries } from '../core/helpers'
import { toVar } from './others'

const WEIGHTS = typedFromEntries(
  (
    [
      ['regular', '400'],
      ['medium', '500'],
      ['bold', '600']
    ] as const
  ).map(([scale, value]) => [scale, toVar({ name: 'font-weight', scale, value })] as const)
)

export const fontWeight = (scale: keyof typeof WEIGHTS): string => WEIGHTS[scale]
