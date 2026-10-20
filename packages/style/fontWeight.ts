import { typedFromEntries } from '../core/helpers'
import { toVar } from './others'

const WEIGHTS = typedFromEntries(
  (
    [
      ['regular', '400'],
      ['medium', '500'],
      ['bold', '600']
    ] as const
  ).map(([token, value]) => [token, toVar({ name: 'font-weight', token, value })] as const)
)

export const fontWeight = (token: keyof typeof WEIGHTS): string => WEIGHTS[token]
