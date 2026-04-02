import { isBlankString, joinArray } from '../../helpers'
import type { Template } from '../../types'
import consts from '../constants'
import escape from '../escape'
import error from './errors'
import { parseQuotedAttr } from './parser'
import { isQuote, isValidAttrName, isSpace } from './validator'

const {
  char: { EQUAL_SIGN },
  regExp: { INVALID_ATTR_FRAGMENT }
} = consts

const tokenizeAttrs = (fragment: string, name: string): Template.AttrToken[] => {
  const tokens: Template.AttrToken[] = [],
    { length }: { length: number } = fragment
  let index: number = 0

  while (index < length) {
    const char: string = fragment[index]
    if (isSpace(char)) {
      index++
      continue
    }

    if (char === EQUAL_SIGN) {
      tokens.push({ type: 'equal-sign', value: EQUAL_SIGN })
      index++
      continue
    }

    if (isQuote(char)) {
      const [value, nextIndex] = parseQuotedAttr({
        name,
        fragment,
        index: index + 1,
        quote: char as Template.Quote
      })
      tokens.push({ type: 'value', value })
      index = nextIndex
      continue
    }

    const startIndex: number = index
    while (index < length && !isSpace(fragment[index]) && fragment[index] !== EQUAL_SIGN) {
      if (INVALID_ATTR_FRAGMENT.test(fragment[index])) throw error(name, 'name')
      index++
    }
    const attrName: string = fragment.slice(startIndex, index)
    if (!isValidAttrName(attrName)) throw error(attrName, 'name')
    tokens.push({ type: 'name', value: attrName })
  }

  return tokens
}

export const normalizeAttrFragment = (fragment: string, name: string): string => {
  if (isBlankString(fragment)) return ''

  const tokens: Template.AttrToken[] = tokenizeAttrs(fragment.trim(), name),
    attrs: string[] = []
  let index = 0

  while (index < tokens.length) {
    const { type, value }: Template.AttrToken = tokens[index++]
    if (type !== 'name') throw error(name, 'name')

    const nextToken: Template.AttrToken | undefined = tokens[index]
    if (nextToken?.type !== 'equal-sign') {
      attrs.push(value)
      continue
    }
    index++ /* @remarks skip '=' token */

    const valueToken: Template.AttrToken = tokens[index++]
    if (valueToken?.type !== 'value') throw error(name, 'name')

    attrs.push(`${value}="${escape(valueToken.value)}"`)
  }

  return joinArray(attrs)
}
