import { browserError, cssObject, ficsCssVar, numberError } from '../core/helpers'
import type { Operator } from './types'

export function calc(expression: string): string
export function calc(operator: Operator, ...remaining: (string | number)[]): string
export function calc(arg: string | Operator, ...remaining: (string | number)[]): string {
  arg = arg.trim()
  return `calc(${remaining.length === 0 ? arg : remaining.join(` ${arg} `)})`
}

/**
 * @param space
 * -
 * - `oklab`: perceptually uniform color space
 * - `srgb`: standard RGB color space
 */
export const colorMix = ({
  colors: [first, second = 'transparent'] = ['currentColor'],
  ratio,
  space = 'oklab'
}: {
  colors?: [string, string?]
  ratio: number | string
  space?: 'oklab' | 'srgb'
}): string => {
  if (typeof ratio === 'number') numberError({ ratio }, 'ratio')
  return `color-mix(in ${space}, ${first} ${typeof ratio === 'number' ? `${ratio * 100}%` : ratio}, ${second})`
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
  token
}: {
  name: string
  value: string
  token?: string
}): string => cssVar(ficsCssVar(`${name}${token === undefined ? '' : `-${token}`}`), value)
