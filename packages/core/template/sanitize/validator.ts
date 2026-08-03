import { isPlainObject } from '../../helpers'
import type { Template } from '../../types'
import { char as c, regExp as r } from '../constants'

export const hasSymbol = <T, S extends symbol>(
  variable: unknown,
  symbol: S
): variable is Record<S, Template.Variable<T>> =>
  !!(variable && isPlainObject(variable) && symbol in variable)

export const isQuote = (char: string): char is Template.Quote =>
  char === c.DOUBLE_QUOTE || char === c.SINGLE_QUOTE

export const isSpace = (char: string): boolean =>
  char === ' ' || char === '\t' || char === '\n' || char === '\f' || char === '\r'

export const isValidAttrName = (attr: string): boolean =>
  attr.length > 0 && !r.CONTROL_CHAR.test(attr) && !r.INVALID_ATTR_FRAGMENT.test(attr)
