import { escape } from '../../helpers'
import type { Template } from '../../types'
import { char as c } from '../constants'
import { error } from '../error'
import { parseQuotedAttr } from '../parser'
import { isQuote, isValidAttrName, isSpace } from '../validator'

export const normalizeAttrFragment = (fragment: string, name: string): string => {
  fragment = fragment.trim()
  if (fragment === '') return ''

  const attrs: string[] = [],
    { length }: { length: number } = fragment
  let index: number = 0

  while (index < length) {
    while (index < length && isSpace(fragment[index])) index++

    const startIndex: number = index
    while (index < length && !isSpace(fragment[index]) && fragment[index] !== c.EQUAL_SIGN) index++

    const attrName: string = fragment.slice(startIndex, index)
    if (!isValidAttrName(attrName)) throw error(name, 'name')

    while (index < length && isSpace(fragment[index])) index++
    if (index >= length || fragment[index] !== c.EQUAL_SIGN) {
      attrs.push(attrName)
      continue
    }

    index++
    while (index < length && isSpace(fragment[index])) index++

    const quote: string | undefined = fragment[index]
    if (!quote || !isQuote(quote)) throw error(name, 'name')

    const [value, nextIndex]: [string, number] = parseQuotedAttr({
      name,
      fragment,
      index: index + 1,
      quote: quote as Template.Quote
    })

    attrs.push(`${attrName}="${escape(value)}"`)
    index = nextIndex
  }

  return attrs.join(' ')
}
