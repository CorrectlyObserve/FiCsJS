import { browserError, numberError } from '../core/helpers'
import type { Operator } from './types'

export function calc(expression: string): Readonly<string>
export function calc(operator: Operator, ...remaining: (string | number)[]): Readonly<string>
export function calc(arg: string | Operator, ...remaining: (string | number)[]): Readonly<string> {
  arg = arg.trim()
  return `calc(${typeof arg === 'string' && remaining.length === 0 ? arg : remaining.join(` ${arg} `)})`
}

export const cssVar = (variable: string): Readonly<string> => {
  variable = variable.trim()
  return `var(--${variable.startsWith('--') ? variable.slice(2) : variable})` as const
}

export const hideScrollbar = {
  '::-webkit-scrollbar': { display: 'none' },
  'scrollbar-width': 'none',
  '-ms-overflow-style': 'none'
} as const

/** @param rem Must be a non-negative number if it is a number. */
export const remToPx = (rem: number | string): Readonly<number> => {
  browserError()

  if (typeof rem === 'string') rem = parseFloat(rem.trim())

  numberError({ rem }, 'non-negative')
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}
