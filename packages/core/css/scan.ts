import { char as c } from '../helpers'
import { BACKSLASH, GROUPING_AT_RULES, IGNORE_TOKENS } from './constants'

export const findCloseBrace = (css: string, openIndex: number): number => {
  let cursor: number = openIndex + 1,
    depth: number = 1

  while (cursor < css.length) {
    const validIndex: number = getNextValidIndex(css, cursor)

    if (validIndex !== cursor) {
      cursor = validIndex
      continue
    }

    if (css[cursor] === '{') depth++
    else if (css[cursor] === '}') {
      depth--
      if (depth === 0) return cursor + 1
    }

    cursor++
  }

  return css.length + 1
}

/** @returns The first index of `delimiters` that sits outside quotes, comments, url() and parentheses. */
export const findDelimiter = ({
  css,
  index,
  delimiters
}: {
  css: string
  index: number
  delimiters: string
}): number => {
  let cursor: number = index,
    depth: number = 0

  while (cursor < css.length) {
    const validIndex: number = getNextValidIndex(css, cursor)

    if (validIndex !== cursor) {
      cursor = validIndex
      continue
    }

    const char: string = css[cursor]

    if (char === '(') depth++
    else if (char === ')') depth--
    else if (depth === 0 && delimiters.includes(char)) return cursor

    cursor++
  }

  return -1
}

export const getNextValidIndex = (css: string, index: number): number => {
  const char: string = css[index],
    ESCAPE_LENGTH: number = BACKSLASH.length + 1

  if (char === BACKSLASH) return Math.min(index + ESCAPE_LENGTH, css.length)

  if (char === c.SINGLE_QUOTE || char === c.DOUBLE_QUOTE) {
    const QUOTE_LENGTH: number = 1 as const
    let cursor: number = index + QUOTE_LENGTH

    while (cursor < css.length) {
      if (css[cursor] === char) return cursor + QUOTE_LENGTH

      cursor += css[cursor] === BACKSLASH ? ESCAPE_LENGTH : 1
    }

    return css.length
  }

  /** @remarks Bypasses expensive `.startsWith()` calls to optimize this per-character loop. */
  for (const { open, close } of IGNORE_TOKENS)
    if (char === open[0] && css.startsWith(open, index)) {
      const end: number = css.indexOf(close, index + open.length)
      return end === -1 ? css.length : end + close.length
    }

  return index
}

export const isGroupingRule = (css: string, index: number = 0): boolean =>
  GROUPING_AT_RULES.some(rule => css.startsWith(rule, index))
