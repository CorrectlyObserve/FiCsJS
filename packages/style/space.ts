import { typedFromEntries } from '../core/helpers'
import { toVar } from './others'
import { size } from './size'

const SCALES = typedFromEntries(
    (['xs', 'sm', 'md', 'lg', 'xl'] as const).map(
      (scale, index) => [scale, toVar({ name: 'space', scale, value: size(2 ** index) })] as const
    )
  ),
  SPACES = {
    ...SCALES,
    ...typedFromEntries(
      (['md'] as const).flatMap(
        scale =>
          [
            [`${scale}-`, `calc(${SCALES[scale]} * 0.75)`],
            [`${scale}+`, `calc(${SCALES[scale]} * 1.5)`]
          ] as const
      )
    )
  }

/**
 * @remarks
 * The defaults, each overridable through --fics-space-<scale>; md- and md+ follow --fics-space-md:
 * - xs: 0.25rem
 * - sm: 0.5rem
 * - md-: 0.75rem
 * - md: 1rem
 * - md+: 1.5rem
 * - lg: 2rem
 * - xl: 4rem
 */
export const space = (scale: keyof typeof SPACES): string => SPACES[scale]
