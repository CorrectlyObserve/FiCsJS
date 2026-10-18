import type { Color } from '../types'

export const GAMMA = 2.4 as const,
  OFFSET = 0.055 as const,
  RGB_MAX = 255 as const,
  SCALE = 1.055 as const,
  SLOPE = 12.92 as const,
  THRESHOLD = 0.04045 as const

export const CSS_VAR: RegExp = /^var\(\s*--([\w-]+)\s*(?:,\s*([^)]*))?\s*\)$/,
  MATRIX_OF_RGB_TO_LMS: { L: Color.Vector; M: Color.Vector; S: Color.Vector } = {
    L: { R: 0.4122214708, G: 0.5363325363, B: 0.0514459929 },
    M: { R: 0.2119034982, G: 0.6806995451, B: 0.1073969566 },
    S: { R: 0.0883024619, G: 0.2817188376, B: 0.6299554352 }
  } as const,
  MATRIX_OF_LMS_TO_OKLAB: { L: Color.Wave; A: Color.Wave; B: Color.Wave } = {
    L: { L: 0.2104542553, M: 0.793617785, S: -0.0040720468 },
    A: { L: 1.9779984951, M: -2.428592205, S: 0.4505937099 },
    B: { L: 0.0259040371, M: 0.7827717662, S: -0.808675766 }
  } as const

/** @remarks Multiplier to simulate a boolean step function (0 or 1) in CSS clamp(). */
export const CLAMP_SCALAR = 100_000 as const,
  /** @remarks ITU-R BT.709: Relative luminance coefficients [R, G, B] based on human eye sensitivity. */
  LUMA = [0.2126, 0.7152, 0.0722] as const,
  LUMINANCE = `(${LUMA[0]} * r + ${LUMA[1]} * g + ${LUMA[2]} * b)` as const,
  MAX_LUMA = 1 as const,
  /** @remarks W3C WCAG 2.x: Minimum contrast ratio (4.5:1) and ambient light surface reflection offset. */
  WCAG_RATIO = 4.5 as const
