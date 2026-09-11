import { cssObject } from '../core/helpers'
import type { TextSize } from './types'

export const textSize = (size: TextSize, isLineHeightNone?: boolean) => {
  let fontSize: string, lineHeight: string

  switch (size) {
    case 'xs':
      fontSize = '0.75rem'
      lineHeight = '1.25rem'
      break

    case 'sm':
      fontSize = '0.875rem'
      lineHeight = '1.375rem'
      break

    case 'ui':
      fontSize = '0.9375rem'
      lineHeight = '1.5rem'
      break

    case 'base':
      fontSize = '1rem'
      lineHeight = '1.5rem'
      break

    case 'lg':
      fontSize = '1.125rem'
      lineHeight = '1.75rem'
      break

    case 'xl':
      fontSize = '1.5rem'
      lineHeight = '2rem'
      break

    case '2xl':
      fontSize = '2rem'
      lineHeight = '2.5rem'
      break

    case '3xl':
      fontSize = '2.5rem'
      lineHeight = '3rem'
      break
  }

  return cssObject({
    'font-size': fontSize,
    'line-height': isLineHeightNone ? 1 : lineHeight
  } as const)
}
