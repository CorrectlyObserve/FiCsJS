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

export const space = (scale: keyof typeof SPACES): string => SPACES[scale]
