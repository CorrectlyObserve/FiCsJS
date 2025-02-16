import { throwWindowError } from './../core/helpers'
import color from './color'

export const calc = (values: (string | number)[], operator: '+' | '-' | '*' | '/'): string =>
  `calc(${values.join(` ${operator} `)})`

export const remToPx = (rem: number | string): number => {
  throwWindowError()

  if (typeof rem === 'string') rem = parseFloat(rem)
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

export const rotate = (degree: number): string => (isNaN(degree) ? '' : `rotate(${degree}deg)`)

export const scale = (decimal: number): string => `scale(${decimal})`

export const variable = (variable: string): string =>
  `var(--${variable.startsWith('--') ? variable.slice(2) : variable})`

export { color }
