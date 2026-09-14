import { HOST_SELECTOR, isBlankString } from '../helpers'
import { AT_RULE, GROUPING_AT_RULES, HOST_CONTEXT_SELECTOR } from './constants'
import { findCloseBracket, findDelimiter, getNextValidIndex } from './scan'

const isHostAt = (selector: string, index: number): boolean =>
    selector.startsWith(HOST_SELECTOR, index) && !selector.startsWith(HOST_CONTEXT_SELECTOR, index),
  replaceHost = (selector: string, ssrHost: string): string => {
    let result: string = '',
      cursor: number = 0

    while (cursor < selector.length) {
      const validIndex: number = getNextValidIndex(selector, cursor)

      if (validIndex !== cursor) {
        result += selector.slice(cursor, validIndex)
        cursor = validIndex
        continue
      }

      if (!isHostAt(selector, cursor)) {
        result += selector[cursor]
        cursor++
        continue
      }

      const openIndex: number = cursor + HOST_SELECTOR.length

      if (selector[openIndex] === '(') {
        const closeIndex: number = findCloseBracket(selector, openIndex)

        /** @remarks Excludes `(` and `)` to convert `:host(.class)` to `[id="id"].class`. */
        result += `${ssrHost}${replaceHost(selector.slice(openIndex + 1, closeIndex - 1), ssrHost)}`
        cursor = closeIndex
      } else {
        result += ssrHost
        cursor = openIndex
      }
    }

    return result
  }

export const addHostToSelectors = ({
  css,
  warnMisuse,
  ssrHost
}: {
  css: string
  warnMisuse: (text: string) => void
  ssrHost?: string
}): string => {
  let result: string = '',
    index: number = 0

  while (index < css.length) {
    const validIndex: number = getNextValidIndex(css, index)

    if (validIndex !== index) {
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

        if (!isBlankString(subSelector))
          /** @remarks Excludes `:host-context()` */
          subSelector = new RegExp(`^${HOST_STRICT}`).test(subSelector)
            ? subSelector
                .replace(new RegExp(HOST_GROUP, 'g'), `${ssrHost}$1`)
                .replace(new RegExp(HOST_STRICT, 'g'), ssrHost)
            : `:where(${ssrHost}) ${subSelector}`

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
