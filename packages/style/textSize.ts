import { cssObject, typedFromEntries } from '../core/helpers'
import { toVar } from './others'

const BASE_SIZES = {
    xs: ['0.75rem', '1.25rem'],
    sm: ['0.875rem', '1.375rem'],
    md: ['1rem', '1.5rem'],
    lg: ['1.25rem', '1.75rem'],
    xl: ['1.5rem', '2rem'],
    '2xl': ['2rem', '2.5rem'],
    '3xl': ['2.5rem', '3rem']
  } as const,
  PROPS = ['font-size', 'line-height'] as const

const createCss = (values: readonly string[]) =>
  typedFromEntries(PROPS.map((name, i) => [name, values[i]] as const))

const SIZES = typedFromEntries(
  (Object.keys(BASE_SIZES) as (keyof typeof BASE_SIZES)[]).flatMap(scale => {
    const [fontSize, lineHeight] = PROPS.map((name, i) =>
        toVar({ name, scale, value: BASE_SIZES[scale][i] })
      ),
      entries: [keyof typeof BASE_SIZES | 'md-' | 'md+', ReturnType<typeof createCss>][] = [
        [scale, createCss([fontSize, lineHeight])]
      ]

    if (scale === 'md')
      entries.push(
        [`${scale}-`, createCss([`calc(${fontSize} * 0.9375)`, lineHeight])],
        [`${scale}+`, createCss([`calc(${fontSize} * 1.125)`, `calc(${lineHeight} + 0.25rem)`])]
      )

    return entries
  })
)

/**
 * @remarks
 * The defaults as font-size / line-height, each overridable through --fics-font-size-<scale> and
 * --fics-line-height-<scale>; md- and md+ follow md:
 *
 * - xs: 0.75rem / 1.25rem
 * - sm: 0.875rem / 1.375rem
 * - md-: 0.9375rem / 1.5rem
 * - md: 1rem / 1.5rem
 * - md+: 1.125rem / 1.75rem
 * - lg: 1.25rem / 1.75rem
 * - xl: 1.5rem / 2rem
 * - 2xl: 2rem / 2.5rem
 * - 3xl: 2.5rem / 3rem
 */
export const textSize = (scale: keyof typeof SIZES, isLineHeightNone?: boolean) =>
  cssObject({ ...SIZES[scale], ...(isLineHeightNone && { [PROPS[1]]: 1 }) })
