import { typedFromEntries } from '../core/helpers'
import { toRem, toVar } from './others'

const STROKES = typedFromEntries(
  (
    [
      ['sm', 0.25],
      ['md', 0.5]
    ] as const
  ).map(([scale, unit]) => [scale, toVar({ name: 'stroke', scale, value: toRem(unit) })] as const)
)

export const stroke = (scale: keyof typeof STROKES): string => STROKES[scale]
