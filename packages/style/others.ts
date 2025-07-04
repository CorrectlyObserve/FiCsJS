import { browserError, checkType, numberError } from './../core/helpers'

export const calc = (values: (string | number)[], operator: '+' | '-' | '*' | '/'): string =>
  `calc(${values.join(` ${operator} `)})`

export const cssVar = (variable: string): string =>
  `var(--${variable.startsWith('--') ? variable.slice(2) : variable})`

export const remToPx = (rem: number | string): number => {
  browserError()

  if (checkType(rem, 'number')) numberError(rem)
  else rem = parseFloat(rem)

  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}
