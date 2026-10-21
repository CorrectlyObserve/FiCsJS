import { ficsCssVar } from '../../core/helpers'

/** @remarks Multiplier to simulate a boolean step function (0 or 1) in CSS clamp(). */
export const CLAMP_SCALAR = 100_000 as const,
  DESCENDANTS = ':where(& *)' as const,
  GAMMA = 2.4 as const,
  OFFSET = 0.055 as const,
  RGB_MAX = 255 as const,
  ROUNDING_THRESHOLD = 0.5 as const,
  SCALE = 1.055 as const,
  SLOPE = 12.92 as const,
  THRESHOLD = 0.04045 as const,
  /** @remarks W3C WCAG 2.x: The 0.05 added to each luminance for the flare of a screen, not the 0.055 of sRGB. */
  WCAG_FLARE = 0.05 as const,
  /** @remarks W3C WCAG 2.x: Minimum contrast ratio (4.5:1). */
  WCAG_RATIO = 4.5 as const

/** @remarks ITU-R BT.709: Relative luminance coefficients [R, G, B] based on human eye sensitivity. */
export const LUMA = [0.2126, 0.7152, 0.0722] as const,
  LUMA_MAX = 1 as const,
  LUMINANCE = `(${LUMA[0]} * r + ${LUMA[1]} * g + ${LUMA[2]} * b)` as const

export const MAIN_COLOR_TOKENS = ['primary', 'success', 'warning', 'danger'] as const,
  COLOR_TOKENS = [
    ...MAIN_COLOR_TOKENS,
    'bg',
    'inverse',
    'text',
    'link',
    'border',
    'divider',
    'shadow'
  ] as const

export const MUTE_RATIO_VAR = ficsCssVar('mute-ratio')

export const oklch = {
  CSS_VAR: /^var\(\s*--([\w-]+)\s*(?:,\s*([^)]*))?\s*\)$/,
  MATRIX_OF_RGB_TO_LMS: {
    L: { R: 0.4122214708, G: 0.5363325363, B: 0.0514459929 },
    M: { R: 0.2119034982, G: 0.6806995451, B: 0.1073969566 },
    S: { R: 0.0883024619, G: 0.2817188376, B: 0.6299554352 }
  } as const,
  MATRIX_OF_LMS_TO_OKLAB: {
    L: { L: 0.2104542553, M: 0.793617785, S: -0.0040720468 },
    A: { L: 1.9779984951, M: -2.428592205, S: 0.4505937099 },
    B: { L: 0.0259040371, M: 0.7827717662, S: -0.808675766 }
  } as const
} as const
