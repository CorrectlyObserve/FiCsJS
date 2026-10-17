import { browserError, cssObject, ficsCssVar, numberError } from '../core/helpers'
import type { Operator } from './types'

export function calc(expression: string): string
export function calc(operator: Operator, ...remaining: (string | number)[]): string
export function calc(arg: string | Operator, ...remaining: (string | number)[]): string {
  arg = arg.trim()
  return `calc(${remaining.length === 0 ? arg : remaining.join(` ${arg} `)})`
}

export const colorMix = ({
  color: [first, second] = ['currentColor', 'transparent'],
  ratio
}: {
  color?: [string, string?]
  ratio: number
}): string => {
  numberError({ ratio }, 'ratio')
  return `color-mix(in oklab, ${first} ${ratio * 100}%, ${second})`
}

export const cssVar = (variable: string, fallback?: string): string => {
  variable = variable.trim()

  const PREFIX = '--' as const,
    name = variable.startsWith(PREFIX) ? variable.slice(PREFIX.length) : variable

  return `var(${PREFIX}${name}${fallback === undefined ? '' : `, ${fallback}`})` as const
}

export const hideScrollbar = cssObject({
  '::-webkit-scrollbar': { display: 'none' },
  'scrollbar-width': 'none',
  '-ms-overflow-style': 'none'
} as const)

export const layout = (size: 'compact' | 'regular' | 'expanded'): string =>
  `style(${ficsCssVar('layout')}: ${size})`

/** @param rem Must be a non-negative number if it is a number. */
export const remToPx = (rem: number | string): Readonly<number> => {
  browserError()

  if (typeof rem === 'string') rem = parseFloat(rem.trim())

  numberError({ rem }, 'non-negative')
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

export const toRem = (unit: number) => `${unit * 0.25}rem` as const

export const toVar = ({
  name,
  value,
  scale
}: {
  name: string
  value: string
  scale?: string
}): string => cssVar(ficsCssVar(`${name}${scale === undefined ? '' : `-${scale}`}`), value)
