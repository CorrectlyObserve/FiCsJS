import { CLAMP_SCALAR, LUMA, LUMINANCE, MAX_LUMA, OFFSET, WCAG_RATIO } from './constants'
import { hexToRgb } from './helpers'
import { TEXTS } from './tokens'
import type { Color } from './types'

const toLuminance = (rgb: Color.RgbArray): number =>
  rgb.reduce((prev, current, index) => prev + current * LUMA[index], 0)

const [lightText, darkText]: Color.RgbArray[] = Object.values(TEXTS).map(hex => {
    const { r, g, b }: Color.Rgb = hexToRgb(hex)
    return [r, g, b]
  }),
  lightLuma: number = toLuminance(lightText),
  darkLuma: number = toLuminance(darkText),
  thresholds: Record<'light' | 'mid' | 'dark', number> = {
    light: (lightLuma + OFFSET) / WCAG_RATIO - OFFSET,
    mid: Math.sqrt((MAX_LUMA + OFFSET) * OFFSET) - OFFSET,
    dark: WCAG_RATIO * (darkLuma + OFFSET) - OFFSET
  },
  steps: string[] = Object.values(thresholds).map(
    threshold => `clamp(0, (${LUMINANCE} - ${threshold.toFixed(4)}) * ${CLAMP_SCALAR}, 1)`
  ),
  /** @remarks Calculates the R, G, B channels, using step functions to switch between light and dark text. */
  channels: string = lightText
    .map((l, i) => {
      const d: number = darkText[i],
        [light, mid, dark]: string[] = steps

      return `calc(${l} + ${light} * (${MAX_LUMA - l}) - ${mid} + ${dark} * ${d})`
    })
    .join(' ')

export const toTextColor = (background: string): string =>
  `color(from ${background} srgb-linear ${channels})`
