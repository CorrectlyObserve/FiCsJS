import type { Template } from '../../types'
import { char as c } from '../constants'
import { error } from './error'
import { isQuote, isSpace, isValidAttrName } from './validator'

const {
  char: {
    COMMENT_CLOSE_TAG,
    COMMENT_OPEN_TAG,
    LEFT_ANGLE_BRACKET,
    RIGHT_ANGLE_BRACKET,
    EQUAL_SIGN
  },
  regExp: { INVALID_ATTR_FRAGMENT }
} = constants

export const getTemplateContexts = (strings: TemplateStringsArray): Template.Context[] => {
  const contexts: Template.Context[] = new Array(Math.max(strings.length - 1, 0))
  let isInComment: boolean = false,
    quote: Template.Quote | null = null,
    isInTag: boolean = false

  for (let i = 0; i < strings.length - 1; i++) {
    const part: string = strings[i]

    for (let charIndex = 0; charIndex < part.length; charIndex++) {
      if (isInComment) {
        if (part.startsWith(c.COMMENT_CLOSE_TAG, charIndex)) {
          isInComment = false
          charIndex += c.COMMENT_CLOSE_TAG.length - 1
        }

        continue
      }

      const char: string = part[charIndex]

      if (quote) {
        if (char === quote) quote = null
        continue
      }

      if (isInTag) {
        if (isQuote(char)) quote = char
        else if (char === c.RIGHT_ANGLE_BRACKET) isInTag = false

        continue
      }

      if (char === c.LEFT_ANGLE_BRACKET)
        if (part.startsWith(c.COMMENT_OPEN_TAG, charIndex)) {
          isInComment = true
          charIndex += c.COMMENT_OPEN_TAG.length - 1
        } else isInTag = true
    }

    contexts[i] = quote ?? (isInTag ? 'tag' : 'text')
  }

  return contexts
}

export const parseQuotedAttr = ({
  name,
  fragment,
  index,
  quote
}: Template.Parsed): [string, number] => {
  let value: string = ''
  const isAttrEnd = (index: number): boolean => {
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

  while (index < fragment.length) {
    const quoteIndex: number = fragment.indexOf(quote, index)
    if (quoteIndex < 0) throw error(name, 'unquoted')

    value += fragment.slice(index, quoteIndex)
    if (isAttrEnd(quoteIndex + 1)) return [value, quoteIndex + 1]

    value += quote
    index = quoteIndex + 1
  }

  throw error(name, 'unquoted')
}
