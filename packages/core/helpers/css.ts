import type { Css } from '../types'
import { AT_KEYFRAMES } from './constants'
import { numberError } from './numberError'
import { convertStr, typedEntries } from './others'
import { isBlankString, isEmptyObject } from './typeCheck'

const convertCss = ({
  css,
  isInKeyframes
}: {
  css: Css.Declarations
  isInKeyframes?: boolean
}): string =>
  typedEntries(css).reduce((prev, [key, value]) => {
    if (typeof key === 'number') numberError({ key }, 'finite')

    if (value === undefined || isBlankString(value) || isEmptyObject(value)) return prev

    const isNested: boolean = typeof value !== 'string' && typeof value !== 'number'
    if (isNested) {
      const cssText: string = convertCss({
        css: value as Css.Declarations,
        isInKeyframes:
          isInKeyframes || (typeof key === 'string' && key.trimStart().startsWith(AT_KEYFRAMES))
      })

      return `${prev}${key.toString()}{${cssText}}`
    }

    let strKey: string

    if (typeof key === 'number') strKey = key.toString()
    /** @remarks CSS custom properties */ else if (key.startsWith('--')) strKey = key
    else {
      key = convertStr(key, 'kebab')
      if (key.startsWith('webkit')) key = `-${key}`
      strKey = key
    }

    return `${prev}${strKey}:${value};`
  }, '')

export const cssDeclarations = <T extends Css.Declarations>(css: T): T =>
  Object.defineProperty(css, 'toString', { value: (): string => convertCss({ css }) })
