import type { Css, DataProps } from '../types'
import { AT_KEYFRAMES } from './constants'
import { numberError } from './numberError'
import { convertStr, typedEntries } from './others'
import { isBlankString, isEmptyObject } from './typeCheck'

const convertCss = <D extends object, P>(
  style: Css.Value<D, P> | Css.Declarations,
  {
    getDataProps,
    normalizeHost = String,
    isInKeyframes
  }: {
    getDataProps?: () => DataProps.Payload<D, P>
    normalizeHost?: (selector: string | number) => string
    isInKeyframes?: boolean
  } = {}
): string =>
  typedEntries(
    typeof style === 'function' ? style(getDataProps?.() as DataProps.Payload<D, P>) : style
  ).reduce((prev, [key, value]) => {
    if (typeof key === 'number') numberError({ key }, 'finite')

    if (value === undefined || isBlankString(value) || isEmptyObject(value)) return prev

    const isNested: boolean = typeof value !== 'string' && typeof value !== 'number'
    if (isNested) {
      const _isInKeyframes: boolean =
          isInKeyframes || (typeof key === 'string' && key.trimStart().startsWith(AT_KEYFRAMES)),
        cssText: string = convertCss(value as Css.Declarations, {
          getDataProps,
          normalizeHost,
          isInKeyframes: _isInKeyframes
        })

      return `${prev}${_isInKeyframes ? key.toString() : normalizeHost(key)}{${cssText}}`
    }

    return `${prev}${normalizeProperty(key)}:${value};`
  }, '')

const normalizeProperty = (key: string | number): string => {
  if (typeof key === 'number') return key.toString()
  /** @remarks CSS custom properties */
  if (key.startsWith('--')) return key

  key = convertStr(key, 'kebab')
  if (key.startsWith('webkit')) key = `-${key}`
  return key
}

export const declarations = <T extends Css.Declarations>(style: T): T =>
  Object.defineProperty(style, 'toString', { value: (): string => convertCss(style) })
