import { numberError } from '../../core/helpers'
import { colorMix, cssVar } from '../others'
import { MUTE_RATIO_VAR } from './constants'
import { oklch } from './oklch'
import type { Color } from './types'

export const adjustLightness = ({
  backgrounds,
  deltas
}: {
  backgrounds: readonly [light: string, dark: string]
  deltas: Record<Color.Tone, number>
}): string =>
  `light-dark(${backgrounds
    .map((bgColor, i) => {
      const delta: number = deltas[i === 0 ? 'light' : 'dark']
      return oklch(bgColor, delta < 0 ? { darker: -delta } : { lighter: delta })
    })
    .join(', ')})`

export const clampLightness = (fill: string, [light, dark]: readonly [number, number]): string =>
  `light-dark(oklch(from ${fill} min(l, ${light}) c h), oklch(from ${fill} max(l, ${dark}) c h))`

export const muteText = ({
  text,
  surface,
  ratio,
  isOnFill
}: {
  text: string
  surface: string
  ratio: number
  isOnFill?: boolean
}): string => {
  if (isOnFill) numberError({ ratio }, 'ratio')
  return colorMix({
    colors: [text, surface],
    ratio: isOnFill ? cssVar(MUTE_RATIO_VAR, `${Math.round(ratio * 100)}%`) : ratio
  })
}
