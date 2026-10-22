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
    if (css.startsWith(COMMENT_TOKEN.open, index)) {
      const validIndex: number = getNextValidIndex(css, index)

      result += css.slice(index, validIndex)
      index = validIndex
      continue
    }

    if (css[index].trim() === '') {
      result += css[index]
      index++
      continue
    }

      const delimitedIndex: number = findDelimiter({ css, index, delimiters: '{;' })
      if (delimitedIndex === -1) {
        const rest: string = css.slice(index).trim()
        if (!isBlankString(rest)) warnMisuse(rest)
        break
      }

    if (css[delimitedIndex] === ';') {
      const upToSemicolon: string = css.slice(index, delimitedIndex + 1)
      upToSemicolon.startsWith(AT_RULE) ? (result += upToSemicolon) : warnMisuse(upToSemicolon)

      index = delimitedIndex + 1
      continue
    }

    const header: string = css.slice(index, delimitedIndex),
      trimmed: string = header.trim(),
      closeIndex: number = findCloseBracket(css, delimitedIndex),
      block: string = css.slice(delimitedIndex + 1, closeIndex - 1),
      rule: string = css.slice(index, closeIndex)

    if (
      ssrHost !== undefined &&
      trimmed.startsWith(AT_RULE) &&
      GROUPING_AT_RULES.some(atRule => trimmed.startsWith(atRule))
    )
      result += `${header}{${addHostToSelectors({ css: block, warnMisuse, ssrHost })}}`
    else if (ssrHost === undefined || trimmed.startsWith(AT_RULE)) result += rule
    else {
      const selectors: string[] = []
      let cursor: number = 0

      while (cursor <= header.length) {
        const commaIndex: number = findDelimiter({ css: header, index: cursor, delimiters: ',' }),
          isLast: boolean = commaIndex === -1
        let selector: string = header.slice(cursor, isLast ? header.length : commaIndex).trim()

        if (!isBlankString(selector))
          selector = isHostAt(selector, 0)
            ? replaceHost(selector, ssrHost)
            : `:where(${ssrHost}) ${selector}`

        selectors.push(selector)
        if (isLast) break

        cursor = commaIndex + 1
      }

      result += `${selectors.join(',')}{${block}}`
    }

    index = closeIndex
  }

    return result
  }
