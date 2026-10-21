import {
  CLAMP_SCALAR,
  GAMMA,
  LUMA,
  LUMA_MAX,
  LUMINANCE,
  ROUNDING_THRESHOLD,
  RGB_MAX,
  SCALE,
  WCAG_FLARE,
  WCAG_RATIO
} from './constants'
import { hexToRgb, isLightTone } from './helpers'
import { TEXTS } from './tokens'
import type { Color } from './types'

const toLuminance = (rgb: Color.RgbArray): number =>
  rgb.reduce((acc, cur, index) => acc + cur * LUMA[index], 0)

const [lightText, darkText]: Color.RgbArray[] = Object.values(TEXTS).map(hex => {
    const { r, g, b }: Color.Rgb = hexToRgb(hex)
    return [r, g, b]
  }),
  lightLuma: number = toLuminance(lightText),
  darkLuma: number = toLuminance(darkText),
  thresholds: Record<Color.Tone | 'mid', number> = {
    light: (lightLuma + WCAG_FLARE) / WCAG_RATIO - WCAG_FLARE,
    mid: Math.sqrt((LUMA_MAX + WCAG_FLARE) * WCAG_FLARE) - WCAG_FLARE,
    dark: WCAG_RATIO * (darkLuma + WCAG_FLARE) - WCAG_FLARE
  },
  steps: string[] = Object.values(thresholds).map(
    threshold => `clamp(0, (${LUMINANCE} - ${threshold.toFixed(4)}) * ${CLAMP_SCALAR}, 1)`
  ),
  /** @remarks Calculates the R, G, B channels, using step functions to switch between light and dark text. */
  channels: string = lightText
    .map((l, i) => {
      const d: number = darkText[i],
        [light, mid, dark]: string[] = steps

      return `calc(${l} + ${light} * (${LUMA_MAX - l}) - ${mid} + ${dark} * ${d})`
    })
    .join(' ')

/**
 * @remarks
 * Utilizes the remaining luminance margin (1 - L) to prevent color clipping
 * while calculating the contrast ratio.
 */
export const adjustLuminance = (color: string, text: Color.Tone): string => {
  const isLight: boolean = isLightTone(text),
    luminanceMargin: number = (ROUNDING_THRESHOLD / RGB_MAX) * (GAMMA / SCALE),
    limit: string = (thresholds[text] + (isLight ? -luminanceMargin : luminanceMargin)).toFixed(6)

  const channels: string = ['r', 'g', 'b']
    .map(cur =>
      isLight
        ? `calc(${cur} * min(1, ${limit} / ${LUMINANCE}))`
        : `calc(${cur} + max(0, (${limit} - ${LUMINANCE}) / (1 - ${LUMINANCE})) * (1 - ${cur}))`
    )
    .join(' ')

  return `color(from ${color} srgb-linear ${channels})`
}

export const toTextColor = (background: string): string =>
  `color(from ${background} srgb-linear ${channels})`
