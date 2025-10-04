import { browserError, checkType, numberError } from './../core/helpers'

export function calc(expression: string): string
export function calc(operator: '+' | '-' | '*' | '/', ...values: (string | number)[]): string
export function calc(arg: string | '+' | '-' | '*' | '/', ...rest: (string | number)[]): string {
  return `calc(${checkType(arg, 'string') && rest.length === 0 ? arg : rest.join(` ${arg} `)})`
}

export const cssVar = (variable: string): string => {
  variable = variable.trim()
  return `var(--${variable.startsWith('--') ? variable.slice(2) : variable})`
}

export const remToPx = (rem: number | string): number => {
  browserError()

  if (checkType(rem, 'number')) numberError({ rem })
  else rem = parseFloat(rem)

  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}
