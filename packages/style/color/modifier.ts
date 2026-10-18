import { oklch } from './oklch'
import { colorMix } from '../others'

export const adjustLightness = ({
  backgrounds,
  deltas
}: {
  backgrounds: readonly [light: string, dark: string]
  deltas: readonly [light: number, dark: number]
}): string => {
  const adjust = (color: string, delta: number): string =>
    oklch(color, delta < 0 ? { darker: -delta } : { lighter: delta })

  const adjusted = backgrounds.map((bg, i) => adjust(bg, deltas[i]))
  return `light-dark(${adjusted.join(', ')})`
}

export const clampLightness = (fill: string, [light, dark]: readonly [number, number]): string =>
  `light-dark(oklch(from ${fill} min(l, ${light}) c h), oklch(from ${fill} max(l, ${dark}) c h))`

export const muteText = ({
  text,
  surface,
  ratio
}: {
  text: string
  surface: string
  ratio: number
}): string => colorMix({ colors: [text, surface], ratio })

const shift = (colorStr: string, by: number): string =>
  oklch(colorStr, by < 0 ? { darker: -by } : { lighter: by })

export const shiftBg = (
  lightBg: string,
  darkBg: string,
  [lightShift, darkShift]: readonly [number, number]
): string => `light-dark(${shift(lightBg, lightShift)}, ${shift(darkBg, darkShift)})`
