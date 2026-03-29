import type { Template } from '../types'

const consts = {
  CONTROL_CHAR: /[\u0000-\u001F\u007F-\u009F]/u,
  INVALID_ATTR_FRAGMENT: /["'<>\/=`]/,
  INVALID_UNQUOTED_ATTR_VALUE: /["'<>`]/
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
