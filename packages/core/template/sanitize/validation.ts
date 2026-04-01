import type { Template } from '../../types'
import consts from '../constants'
import { isSpace, skipSpace } from './space'

const {
  char: { DOUBLE_QUOTE, SINGLE_QUOTE },
  regExp: { CONTROL_CHAR, INVALID_ATTR_FRAGMENT }
} = consts

export const isAttrEnd = (fragment: string, index: number): boolean => {
  skipSpace(fragment, index)
  if (index >= fragment.length) return true

  let endIndex: number = index
  while (endIndex < fragment.length && !isSpace(fragment[endIndex]) && fragment[endIndex] !== '=') {
    const char: string = fragment[endIndex]
    if (INVALID_ATTR_FRAGMENT.test(char)) return false
    endIndex++
  }

  return isValidAttrName(fragment.slice(index, endIndex))
}

export const isQuote = (char: string): char is Template.Quote =>
  char === DOUBLE_QUOTE || char === SINGLE_QUOTE

export const isValidAttrName = (attr: string): boolean =>
  attr.length > 0 && !CONTROL_CHAR.test(attr) && !INVALID_ATTR_FRAGMENT.test(attr)
