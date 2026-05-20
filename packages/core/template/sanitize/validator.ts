import { isPlainObject } from '../../helpers'
import type { Template } from '../../types'
import { constants } from '../constants'

const {
  char: { DOUBLE_QUOTE, SINGLE_QUOTE },
  regExp: { CONTROL_CHAR, INVALID_ATTR_FRAGMENT }
} = constants

export const hasSymbol = <T, S extends symbol>(
  variable: unknown,
  symbol: S
): variable is Record<S, Template.Variable<T>> =>
  !!(variable && isPlainObject(variable) && symbol in variable)

export const isQuote = (char: string): char is Template.Quote =>
  char === DOUBLE_QUOTE || char === SINGLE_QUOTE

export const isSpace = (char: string): boolean =>
  char === ' ' || char === '\t' || char === '\n' || char === '\f' || char === '\r'

export const isValidAttrName = (attr: string): boolean =>
  attr.length > 0 && !CONTROL_CHAR.test(attr) && !INVALID_ATTR_FRAGMENT.test(attr)
