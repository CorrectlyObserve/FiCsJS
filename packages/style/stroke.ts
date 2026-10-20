import { typedFromEntries } from '../core/helpers'
import { toRem, toVar } from './others'

const STROKES = typedFromEntries(
  (
    [
      ['sm', 0.25],
      ['md', 0.5]
    ] as const
  ).map(([token, unit]) => [token, toVar({ name: 'stroke', token, value: toRem(unit) })] as const)
)

export const stroke = (token: keyof typeof STROKES): string => STROKES[token]
