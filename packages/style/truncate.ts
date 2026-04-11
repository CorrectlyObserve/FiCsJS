import { numberError } from './../core/helpers'

export default (maxLines: number = 1) => {
  numberError({ maxLines }, 'positive-int')

  if (maxLines === 1) {
    return {
      overflow: 'hidden',
      'white-space': 'nowrap',
      'text-overflow': 'ellipsis'
    } as const
  }

  return {
    display: '-webkit-box',
    overflow: 'hidden',
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': maxLines.toString()
  } as const
}
