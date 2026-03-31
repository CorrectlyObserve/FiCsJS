import type { Template } from '../types'
import escape from './escape'

const consts = {
  CONTROL_CHAR: /[\u0000-\u001F\u007F-\u009F]/u,
  INVALID_ATTR_FRAGMENT: /["'<>\/=`]/,
  INVALID_UNQUOTED_ATTR_VALUE: /["'<>`]/,
  COMMENT_OPEN_TAG: '<!--',
  COMMENT_CLOSE_TAG: '-->'
} as const

const isSpace = (char: string): boolean =>
    char === ' ' || char === '\t' || char === '\n' || char === '\f' || char === '\r',
  isValidAttrName = (attr: string): boolean =>
    attr.length > 0 && !consts.CONTROL_CHAR.test(attr) && !/[\s"'<>\/=`]/u.test(attr),
  isAttrEnd = (fragment: string, index: number): boolean => {
    while (isSpace(fragment[index])) index++
    if (index >= fragment.length) return true

    let endIndex: number = index
    while (
      endIndex < fragment.length &&
      !isSpace(fragment[endIndex]) &&
      fragment[endIndex] !== '='
    ) {
      const char: string = fragment[endIndex]
      if (consts.INVALID_ATTR_FRAGMENT.test(char)) return false
      endIndex++
    }

    return isValidAttrName(fragment.slice(index, endIndex))
  },
  parseQuotedAttr = ({
    componentName,
    fragment,
    index,
    quote
  }: {
    componentName: string
    fragment: string
    index: number
    quote: Template.Quote
  }): [string, number] => {
    const error: string = `The attribute fragment in ${componentName} is not properly closed...`
    let value: string = ''

    while (index < fragment.length) {
      const quoteIndex: number = fragment.indexOf(quote, index)
      if (quoteIndex < 0) throw new Error(error)

      value += fragment.slice(index, quoteIndex)
      if (isAttrEnd(fragment, quoteIndex + 1)) return [value, quoteIndex + 1]

      value += quote
      index = quoteIndex + 1
    }

    throw new Error(error)
  }

const isQuote = (char: string): char is Template.Quote => char === '"' || char === "'",
  getTemplateContexts = (strings: TemplateStringsArray): Template.Context[] => {
    const contexts: Template.Context[] = new Array(Math.max(strings.length - 1, 0))
    let isInComment: boolean = false,
      quote: Template.Quote | null = null,
      isInTag: boolean = false

    for (let i = 0; i < strings.length - 1; i++) {
      const part: string = strings[i]

      for (let charIndex = 0; charIndex < part.length; charIndex++) {
        if (isInComment) {
          if (part.startsWith(consts.COMMENT_CLOSE_TAG, charIndex)) {
            isInComment = false
            charIndex += consts.COMMENT_CLOSE_TAG.length - 1
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
          else if (char === '>') isInTag = false

          continue
        }

        if (char === '<')
          if (part.startsWith(consts.COMMENT_OPEN_TAG, charIndex)) {
            isInComment = true
            charIndex += consts.COMMENT_OPEN_TAG.length - 1
          } else isInTag = true
      }

      contexts[i] = quote ?? (isInTag ? 'tag' : 'text')
    }

    return contexts
  }

const normalizeAttrFragment = (fragment: string, name: string): string => {
  if (isBlankString(fragment)) return ''

  fragment = fragment.trim()

  const { length } = fragment,
    error: string = `The attribute fragment in ${name} is invalid...`,
    attrs: string[] = new Array()
  let index: number = 0

  while (index < length) {
    while (index < length) {
      if (!isSpace(fragment[index])) break
      index++
    }

    if (index >= length) break

    const startIndex: number = index

    while (index < length) {
      const char: string = fragment[index]
      if (isSpace(char) || char === '=') break
      if (consts.INVALID_ATTR_FRAGMENT.test(char)) throw new Error(error)
      index++
    }

    const attrName: string = fragment.slice(startIndex, index)
    if (!isValidAttrName(attrName)) throw new Error(error)

    while (index < length) {
      if (!isSpace(fragment[index])) break
      index++
    }

    if (fragment[index] !== '=') {
      attrs.push(attrName)
      continue
    }

    index++

    while (index < length) {
      if (!isSpace(fragment[index])) break
      index++
    }

    if (index >= length) throw new Error(error)

    let value: string
    const quote: string = fragment[index]

    if (isQuote(quote)) value = parseQuotedAttr({ name, fragment, index: index + 1, quote })[0]
    else {
      const startIndex: number = index

      while (index < length) {
        const char: string = fragment[index]
        if (isSpace(char)) break
        if (consts.INVALID_ATTR_FRAGMENT.test(char)) throw new Error(error)
        index++
      }

      value = fragment.slice(startIndex, index)
    }

    attrs.push(`${attrName}="${escape(value)}"`)
  }

  return joinArray(attrs)
}
