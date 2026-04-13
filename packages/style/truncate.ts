import { numberError } from './../core/helpers'

/** @param maxLines Must be a positive integer. Default is `1`. */
export default (maxLines: number = 1) => {
  numberError({ maxLines }, 'positive-int')

  if (maxLines === 1)
    return { overflow: 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis' } as const

  return {
    display: '-webkit-box',
    overflow: 'hidden',
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': maxLines
  } as const
}
