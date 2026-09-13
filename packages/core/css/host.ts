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
      const style: string = css.slice(index, delimitedIndex + 1),
        trimmed: string = style.trim()

      startsWithAtRule(trimmed) ? (result += style) : warnMisuse(trimmed)
      index = delimitedIndex + 1
      continue
    }

    const selector: string = css.slice(index, delimitedIndex),
      closeIndex: number = findCloseBrace(css, delimitedIndex),
      style: string = css.slice(delimitedIndex + 1, closeIndex - 1),
      trimmed: string = selector.trim(),
      fullBlock: string = css.slice(index, closeIndex)

    if (
      ssrHost !== undefined &&
      startsWithAtRule(trimmed) &&
      GROUPING_AT_RULES.some(rule => trimmed.startsWith(rule))
    )
      result += `${selector}{${addHostToSelectors({ css: style, warnMisuse, ssrHost })}}`
    else if (ssrHost === undefined || startsWithAtRule(trimmed)) result += fullBlock
    else {
      const { length }: { length: number } = selector,
        selectors: string[] = []
      let cursor: number = 0

      while (cursor <= length) {
        const commaIndex: number = findDelimiter({ css: selector, index: cursor, delimiters: ',' }),
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
