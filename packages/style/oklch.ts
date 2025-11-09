import { browserError, numberError } from '../core/helpers'
import { Lms, Oklab, Oklch, Rgb, Vector, Wave } from './types'

const caches: Map<string, Oklch> = new Map(),
  convertCssVar = (str: string): string => {
    const matcher: string | undefined = str.match(/^var\(--(.*)\)/)?.[1]
    if (matcher) {
      browserError()
      str = getComputedStyle(document.documentElement).getPropertyValue(`--${matcher}`)
    }

    return str
  },
  hexToRgb = (hex: string): Rgb => {
    hex = convertCssVar(hex)

    if (!hex.startsWith('#'))
      throw new Error(`The "${hex}" must start with "#" and follow a valid format...`)

    let _hex: string = hex.replace(/^#/, '').toLowerCase()

    if (_hex.length !== 3 && _hex.length !== 6)
      throw new Error(`The "${hex}" must be a valid HEX color code...`)

    if (_hex.length === 3) _hex = _hex.replace(/([a-f\d])/g, '$1$1')

    const MAX = 255 as const,
      THRESHOLD = 0.04045 as const,
      DIVISOR = 12.92 as const,
      OFFSET = 0.055 as const,
      SCALE = 1.055 as const,
      EXPONENT = 2.4 as const,
      toLinearSRgb = (c: number): number => {
        const v = c / MAX
        return v <= THRESHOLD ? v / DIVISOR : ((v + OFFSET) / SCALE) ** EXPONENT
      },
      rgb: Rgb = { r: 0, g: 0, b: 0 }

    for (const [index, color] of ['r', 'g', 'b'].entries())
      rgb[color as keyof Rgb] = toLinearSRgb(parseInt(_hex.slice(index * 2, index * 2 + 2), 16))

    return rgb
  },
  rgbToOklch = ({ r, g, b }: Rgb): Oklch => {
    numberError({ r, g, b }, false)

    const MATRIX_OF_RGB_TO_LMS: { L: Vector; M: Vector; S: Vector } = {
        L: { R: 0.4122214708, G: 0.5363325363, B: 0.0514459929 },
        M: { R: 0.2119034982, G: 0.6806995451, B: 0.1073969566 },
        S: { R: 0.0883024619, G: 0.2817188376, B: 0.6299554352 }
      } as const,
      lms: Lms = { l: 0, m: 0, s: 0 } as const,
      rgbToLms = ({ R, G, B }: Vector): number => Math.cbrt(R * r + G * g + B * b)

    for (const [key, vector] of Object.entries(MATRIX_OF_RGB_TO_LMS))
      lms[key.toLowerCase() as keyof Lms] = rgbToLms(vector)

    const MATRIX_OF_LMS_TO_OKLAB: { L: Wave; A: Wave; B: Wave } = {
        L: { L: 0.2104542553, M: 0.793617785, S: -0.0040720468 },
        A: { L: 1.9779984951, M: -2.428592205, S: 0.4505937099 },
        B: { L: 0.0259040371, M: 0.7827717662, S: -0.808675766 }
      } as const,
      oklab: Oklab = { l: 0, a: 0, b: 0 } as const,
      lmsToLab = ({ L, M, S }: Wave): number => L * lms.l + M * lms.m + S * lms.s

    for (const [key, wave] of Object.entries(MATRIX_OF_LMS_TO_OKLAB))
      oklab[key.toLowerCase() as keyof Oklab] = lmsToLab(wave)

    const { a: _a, b: _b }: Oklab = oklab

    let h: number = Math.atan2(_b, _a) * (180 / Math.PI)
    if (h < 0) h += 360

    return { l: oklab.l, c: Math.sqrt(_a ** 2 + _b ** 2), h }
  },
  hexToOklch = (hex: string): Oklch => {
    if (caches.has(hex)) return caches.get(hex)!

    const rgb: Rgb = hexToRgb(hex),
      oklch: Oklch = rgbToOklch(rgb)

    for (const [key, decimalPlace] of Object.entries({ l: 4, c: 4, h: 2 })) {
      const value: number = oklch[key as keyof Oklch]
      numberError({ [key]: value }, false)

      const multiplier: number = 10 ** decimalPlace
      oklch[key as keyof Oklch] = Math.round(value * multiplier) / multiplier
    }

    caches.set(hex, oklch)
    return oklch
  }

export default (
  hex: string,
  options?: {
    darker?: number
    lighter?: number
    chroma?: number
    opacity?: number
  }
): string => {
  hex = convertCssVar(hex)

  const matcher: string | undefined = hex.match(/^oklch\((.*)\)/)?.[1]
  if (matcher) {
    const oklch: Oklch = { l: 0, c: 0, h: 0 },
      keys: (keyof Oklch)[] = Object.keys(oklch) as (keyof Oklch)[]

    for (const [index, value] of matcher.split(' ').entries())
      oklch[keys[index]] = parseFloat(value)

    caches.set(hex, oklch)
  }

  const { l, c, h }: Oklch = hexToOklch(hex),
    { darker = 0, lighter = 0, chroma = 1, opacity = 1 } = options ?? {}

  numberError({ darker, lighter, chroma, opacity }, false)

  if (darker > 0 && lighter > 0)
    throw new Error('Both "darker" and "lighter" options cannot be specified at the same time...')

  let _l: number = l

  if (darker > 0) _l = Math.max(0, l - darker)
  else if (lighter > 0) _l = Math.min(1, l + lighter)

  return `oklch(${_l * 100}% ${c * chroma} ${h} / ${opacity})`
}
