import { attrs } from '../constants'
import { HOST_SELECTOR, isBlankString } from '../helpers'
import { AT_RULE, COMMENT_TOKEN, HOST_CONTEXT_SELECTOR, SCOPE_SELECTOR } from './constants'
import { findCloseBracket, findDelimiter, getNextValidIndex } from './scan'

const isHostAt = (css: string, index: number): boolean => {
    const head: string = css.slice(index, index + HOST_CONTEXT_SELECTOR.length).toLowerCase()
    return head.startsWith(HOST_SELECTOR) && !head.startsWith(HOST_CONTEXT_SELECTOR)
  },
  toScope = (css: string): string => {
    let result: string = '',
      cursor: number = 0

    while (cursor < css.length) {
      const validIndex: number = getNextValidIndex(css, cursor)

      if (validIndex !== cursor) {
        result += css.slice(cursor, validIndex)
        cursor = validIndex
      } else if (isHostAt(css, cursor)) {
        const openIndex: number = cursor + HOST_SELECTOR.length

        if (css[openIndex] === '(') {
          const closeIndex: number = findCloseBracket(css, openIndex)

          result += `${SCOPE_SELECTOR}:is(${toScope(css.slice(openIndex + 1, closeIndex - 1))})`
          cursor = closeIndex
        } else {
          result += SCOPE_SELECTOR
          cursor = openIndex
        }
      } else result += css[cursor++]
    }

    return result
  },
  dropBareDeclarations = (css: string, warnMisuse: (text: string) => void): string => {
    let result: string = '',
      index: number = 0

    while (index < css.length) {
      const validIndex: number = getNextValidIndex(css, index)

      if (css.startsWith(COMMENT_TOKEN.open, index) || css[index].trim() === '') {
        const end: number = validIndex === index ? index + 1 : validIndex

        result += css.slice(index, end)
        index = end
        continue
      }

      const delimitedIndex: number = findDelimiter({ css, index, delimiters: '{;' })
      if (delimitedIndex === -1) {
        const rest: string = css.slice(index).trim()
        if (!isBlankString(rest)) warnMisuse(rest)
        break
      }

      const end: number =
          css[delimitedIndex] === ';' ? delimitedIndex + 1 : findCloseBracket(css, delimitedIndex),
        chunk: string = css.slice(index, end)

      if (css[delimitedIndex] === '{' || chunk.startsWith(AT_RULE)) result += chunk
      else warnMisuse(chunk)

      index = end
    }

    return result
  }
