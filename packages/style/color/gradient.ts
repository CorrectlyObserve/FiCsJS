import { numberError } from '../../core/helpers'
import { fitToText } from './math'
import type { Color } from './types'

export const gradient = (
  colors: readonly (string | readonly [color: string, position: string])[],
  {
    deg = 180,
    text = 'light',
    adjust = true
  }: { deg?: number; text?: Color.Tone; adjust?: boolean } = {}
): Color.Gradient => {
  numberError({ deg }, 'finite')

  /** @remarks Midpoints keep 4.5:1 only in srgb for light text and in oklab for dark. */
  const colorSpace: 'srgb' | 'oklab' = ({ light: 'srgb', dark: 'oklab' } as const)[text],
    entries: string = colors
      .map(entry => {
        const [color, position] = typeof entry === 'string' ? [entry] : entry
        return `${adjust ? fitToText(color, text) : color}${position ? ` ${position}` : ''}`
      })
      .join(', '),
    image: string = `linear-gradient(in ${colorSpace} ${deg}deg, ${entries})`

  return { image, text, toString: () => image }
}
