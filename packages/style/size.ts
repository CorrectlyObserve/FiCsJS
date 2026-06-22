import { numberError } from '../core/helpers'
import type { Rect } from './types'

/** @param diameter Must be a positive integer. */
export const circle = (diameter: number) =>
  ({ ...rect(diameter, diameter), borderRadius: '50%', overflow: 'hidden' }) as const

/**
 * @param width Must be a positive integer.
 * @param height Must be a positive integer. Defaults to same as `auto`.
 */
export const rect = (width: Rect, height: Rect = 'auto') => {
  const isNumber = (size: Rect): size is number => typeof size === 'number'

  if (isNumber(width)) numberError({ width }, 'positive-int')
  if (isNumber(height)) numberError({ height }, 'positive-int')

  return {
    width: isNumber(width) ? `${width * 0.25}rem` : width,
    height: isNumber(height) ? `${height * 0.25}rem` : height
  } as const
}

/** @param unit Must be an integer. */
export const size = (unit: number) => {
  numberError({ unit }, 'int')
  return `${unit * 0.25}rem` as const
}
