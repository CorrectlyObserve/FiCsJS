import type { Css } from '../types'
import { convertStr, typedEntries } from './others'
import { isBlankString, isEmptyObject } from './typeCheck'

const convertCss = (css: Css.Declarations): string =>
  typedEntries(css).reduce((prev, [key, value]) => {
    if (value === undefined || isBlankString(value) || isEmptyObject(value)) return prev

    const isNested: boolean = typeof value !== 'string' && typeof value !== 'number'
    if (isNested) return `${prev}${key.toString()}{${convertCss(value as Css.Declarations)}}`

    let strKey: string = key.toString()
    const isCssCustomProperty: boolean = strKey.startsWith('--')

    if (!isCssCustomProperty) {
      strKey = convertStr(strKey, 'kebab')
      if (strKey.startsWith('webkit')) strKey = `-${strKey}`
    }

    return `${prev}${strKey}:${value};`
  }, '')

export const cssDeclarations = <T extends Css.Declarations>(css: T): T =>
  Object.defineProperty(css, 'toString', { value: (): string => convertCss(css) })
