import { numberError } from './../core/helpers'
import type { SizeCtx } from './types'

/** @param diameter This value must be a positive integer. */
export const circle = (diameter: number) =>
  ({ ...size(diameter), borderRadius: '50%', overflow: 'hidden' }) as const

/**
 * @param width This value must be a positive integer.
 * @param height This value must be a positive integer. Default is same as `width`.
 */
export const size = (width: SizeCtx, height: SizeCtx = width) => {
  const isNumber = (size: SizeCtx): size is number => typeof size === 'number'

  if (isNumber(width)) numberError({ width }, 'positive-int')
  if (isNumber(height)) numberError({ height }, 'positive-int')

  return {
    width: isNumber(width) ? `${width * 0.25}rem` : width,
    height: isNumber(height) ? `${height * 0.25}rem` : height
  } as const
}
