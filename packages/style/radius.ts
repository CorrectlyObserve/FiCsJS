import { typedFromEntries } from '../core/helpers'
import { toVar } from './others'
import { size } from './size'

const RADII = typedFromEntries(
  (
    [
      ['none', '0'],
      ['sm', size(2)],
      ['lg', size(4)],
      ['full', '9999rem']
    ] as const
  ).map(([scale, value]) => [scale, toVar({ name: 'radius', scale, value })] as const)
)

export const radius = (scale: keyof typeof RADII): string => RADII[scale]
