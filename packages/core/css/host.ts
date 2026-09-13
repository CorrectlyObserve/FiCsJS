import { isBlankString } from '../helpers'
import { AT_RULE, GROUPING_AT_RULES, HOST_GROUP, HOST_STRICT } from './constants'
import { findCloseBrace, findDelimiter, getNextValidIndex } from './scan'

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
  const startsWithAtRule = (css: string): boolean => css.startsWith(AT_RULE)

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
      closeIndex: number = findCloseBracket(css, delimitedIndex),
      block: string = css.slice(delimitedIndex + 1, closeIndex - 1),
      rule: string = css.slice(index, closeIndex),
      trimmed: string = header.trim()

    if (
      ssrHost !== undefined &&
      trimmed.startsWith(AT_RULE) &&
      GROUPING_AT_RULES.some(atRule => trimmed.startsWith(atRule))
    )
      result += `${header}{${addHostToSelectors({ css: block, warnMisuse, ssrHost })}}`
    else if (ssrHost === undefined || trimmed.startsWith(AT_RULE)) result += rule
    else {
      const { length }: { length: number } = header,
        selectors: string[] = []
      let cursor: number = 0

      while (cursor <= length) {
        const commaIndex: number = findDelimiter({ css: header, index: cursor, delimiters: ',' }),
          isLast: boolean = commaIndex === -1
        let subSelector: string = selector.slice(cursor, isLast ? length : commaIndex).trim()

        if (!isBlankString(subSelector))
          /** @remarks Excludes `:host-context()` */
          subSelector = new RegExp(`^${HOST_STRICT}`).test(subSelector)
            ? subSelector
                .replace(new RegExp(HOST_GROUP, 'g'), `${ssrHost}$1`)
                .replace(new RegExp(HOST_STRICT, 'g'), ssrHost)
            : `:where(${ssrHost}) ${subSelector}`

        selectors.push(subSelector)
        if (isLast) break

        cursor = commaIndex + 1
      }

      result += `${selectors.join(',')}{${style}}`
    }

    index = closeIndex
  }

  return result
}
