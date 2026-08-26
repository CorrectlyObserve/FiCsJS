import { convertStr, isBlankString, isEmptyObject, numberError, typedEntries } from './helpers'
import type { Css, DataProps } from './types'

const normalizeProperty = (key: string | number): string => {
  if (typeof key === 'number') return key.toString()
  /** @remarks CSS custom properties */
  if (key.startsWith('--')) return key

  key = convertStr(key, 'kebab')
  if (key.startsWith('webkit')) key = `-${key}`
  return key
}

export const cssToString = <D extends object = {}, P = {}>(
  css: Css.Sheet<D, P>[],
  {
    getDataProps,
    normalizeHost = String
  }: {
    getDataProps?: () => DataProps.Payload<D, P>
    normalizeHost?: (selector: string | number) => string
  } = {}
): string => {
  if (css.length === 0) return ''

  const convertCss = (style: Css.Value<D, P> | Css.Declarations, topLevelCss: string[]): string =>
    typedEntries(typeof style === 'function' ? style(getDataProps!()) : style).reduce(
      (prev, [key, value]) => {
        if (typeof key === 'number') numberError({ key }, 'finite')

        if (value === undefined || isBlankString(value) || isEmptyObject(value)) return prev

        if (typeof key === 'string' && key.startsWith('@keyframes')) {
          topLevelCss.push(`${key}{${convertCss(value as Css.Value<D, P>, topLevelCss)}}`)
          return prev
        }

        if (typeof value === 'string' || typeof value === 'number')
          return `${prev}${normalizeProperty(key)}:${value};`

        return `${prev}${normalizeHost(key)}{${convertCss(value as Css.Declarations, topLevelCss)}}`
      },
      ''
    )

  return css.reduce<string>((prev, curr) => {
    if (typeof curr === 'string') return `${prev}${normalizeHost(curr)}`

    const topLevelCss: string[] = [],
      joinCss = (cssTexts: string[]): string => [prev, ...cssTexts, ...topLevelCss].join('')

    if (typeof curr === 'function')
      return joinCss([
        normalizeHost(
          curr({
            ...getDataProps?.(),
            cssToString: (declarations: Css.Declarations) => convertCss(declarations, topLevelCss)
          } as DataProps.Payload<D, P> & { cssToString: Css.ToString })
        )
      ])

    return joinCss(
      typedEntries(curr).map(
        ([selector, style]) => `${normalizeHost(selector)}{${convertCss(style, topLevelCss)}}`
      )
    )
  }, '')
}
