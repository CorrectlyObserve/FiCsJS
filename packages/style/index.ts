import { browserError, checkType } from './../core/helpers'
import color from './color'
import { flexCenter } from './flexCenter'

export const absoluteCenter = (
  axis: 'xy' | 'y',
  isFixed?: boolean
): {
  position: 'absolute' | 'fixed'
  top: '50%'
  left?: '50%'
  transform: 'translate(-50%, -50%)' | 'translateY(-50%)'
} => ({
  position: isFixed ? 'fixed' : 'absolute',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  ...(axis === 'xy' ? { left: '50%' } : { transform: 'translateY(-50%)' })
})

export const calc = (values: (string | number)[], operator: '+' | '-' | '*' | '/'): string =>
  `calc(${values.join(` ${operator} `)})`

export const remToPx = (rem: number | string): number => {
  browserError()

  if (checkType(rem, 'string')) rem = parseFloat(rem)
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

export const rotate = (degree: number): string => (isNaN(degree) ? '' : `rotate(${degree}deg)`)

export const scale = (decimal: number): string => `scale(${decimal})`

export const variable = (variable: string): string =>
  `var(--${variable.startsWith('--') ? variable.slice(2) : variable})`

export { color, flexCenter }
