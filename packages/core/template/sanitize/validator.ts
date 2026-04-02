import { isPlainObject } from '../../helpers'
import type { Template } from '../../types'
import consts from '../constants'

const {
  char: { DOUBLE_QUOTE, EQUAL_SIGN, SINGLE_QUOTE },
  regExp: { CONTROL_CHAR, INVALID_ATTR_FRAGMENT }
} = consts

export const isAttrEnd = (fragment: string, index: number): boolean => {
  const { length }: { length: number } = fragment

  while (index < length && isSpace(fragment[index])) index++

  if (index >= length) return true

  let endIndex: number = index
  while (endIndex < length && !isSpace(fragment[endIndex]) && fragment[endIndex] !== EQUAL_SIGN) {
    if (INVALID_ATTR_FRAGMENT.test(fragment[endIndex])) return false
    endIndex++
  }

  return isValidAttrName(fragment.slice(index, endIndex))
}

export const isQuote = (char: string): char is Template.Quote =>
  char === DOUBLE_QUOTE || char === SINGLE_QUOTE

export const isSpace = (char: string): boolean =>
  char === ' ' || char === '\t' || char === '\n' || char === '\f' || char === '\r'

export const isValidAttrName = (attr: string): boolean =>
  attr.length > 0 && !CONTROL_CHAR.test(attr) && !INVALID_ATTR_FRAGMENT.test(attr)

export const hasSymbol = <T, S extends symbol>(
  variable: unknown,
  symbol: S
): variable is Record<S, Template.Variable<T>> =>
  !!(variable && isPlainObject(variable) && symbol in variable)
