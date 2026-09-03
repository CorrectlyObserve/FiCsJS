import { cssDeclarations, numberError } from '../core/helpers'

/** @param maxLines Must be a positive integer. Defaults to `1`. */
export const truncate = (maxLines: number = 1) => {
  numberError({ maxLines }, 'positive-int')

  if (maxLines === 1)
    return cssDeclarations({
      overflow: 'hidden',
      'white-space': 'nowrap',
      'text-overflow': 'ellipsis'
    } as const)

  return cssDeclarations({
    display: '-webkit-box',
    overflow: 'hidden',
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': maxLines
  } as const)
}
