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
  ).map(([token, value]) => [token, toVar({ name: 'radius', token, value })] as const)
)

export const radius = (token: keyof typeof RADII): string => RADII[token]
