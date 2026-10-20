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
  (Object.keys(BASE_SIZES) as (keyof typeof BASE_SIZES)[]).flatMap(token => {
    const [fontSize, lineHeight] = PROPS.map((name, i) =>
        toVar({ name, token, value: BASE_SIZES[token][i] })
      ),
      entries: [keyof typeof BASE_SIZES | 'md-' | 'md+', ReturnType<typeof createCss>][] = [
        [token, createCss([fontSize, lineHeight])]
      ]

    if (token === 'md')
      entries.push(
        [`${token}-`, createCss([`calc(${fontSize} * 0.9375)`, lineHeight])],
        [`${token}+`, createCss([`calc(${fontSize} * 1.125)`, `calc(${lineHeight} + 0.25rem)`])]
      )

    return entries
  })
)

/**
 * @remarks
 * The defaults as font-size / line-height, each overridable through --fics-font-size-<token> and
 * --fics-line-height-<token>; md- and md+ follow md:
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
export const textSize = (token: keyof typeof SIZES, isLineHeightNone?: boolean) =>
  cssObject({ ...SIZES[token], ...(isLineHeightNone && { [PROPS[1]]: 1 }) })
