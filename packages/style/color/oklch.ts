import { numberError, typedEntries } from '../../core/helpers'
import type { Color } from '../types'
import { GAMMA, OFFSET, RGB_MAX, SCALE, SLOPE, THRESHOLD } from './constants'

const CSS_VAR: RegExp = /^var\(\s*--([\w-]+)\s*(?:,\s*([^)]*))?\s*\)$/,
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

const cache: Map<string, Color.Oklch> = new Map(),
  parseOklch = (literal: string): Color.Oklch & { a: number } => {
    const match: RegExpMatchArray | null = literal.trim().match(/^oklch\(\s*(.+)\s*\)$/i),
      OKLCH_LITERAL = '"oklch(<lightness> <chroma> <hue>[/ <alpha>])"' as const

    if (!match)
      throw new Error(`The oklch() literal "${literal}" must match the format ${OKLCH_LITERAL}...`)

    const segments: string[] = match[1].split('/').map(s => s.trim())

    if (segments.length > 2)
      throw new Error(`The oklch() literal "${literal}" must contain at most one "/" separator...`)

    const [lch, alpha]: string[] = match[1].split('/').map(s => s.trim()),
      parts: string[] = lch.split(/\s+/).filter(Boolean)

    if (parts.length < 3)
      throw new Error(
        `The oklch() literal "${literal}" must contain at least three values (L C H) like ${OKLCH_LITERAL}...`
      )

    const parsePercent = (s: string): number =>
      s.endsWith('%') ? parseFloat(s) / 100 : parseFloat(s)

    const l: number = parsePercent(parts[0]),
      c: number = parseFloat(parts[1]),
      h: number = parseFloat(parts[2]),
      a: number = alpha ? parsePercent(alpha) : 1

    numberError({ l, c, h }, 'non-negative')
    numberError({ a }, 'ratio')
    return { l, c, h, a }
  },
  cacheKey = (type: 'hex' | 'oklch', key: string): string => `${type}:${key}`,
  alphaFromHex = (hex: string): number => {
    hex = hex.replace(/^#/, '').toLowerCase()
    const { length }: { length: number } = hex

    if (![3, 4, 6, 8].some(_length => length === _length) || !/^[a-f\d]+$/.test(hex))
      throw new Error(
        `The HEX color "${hex}" is invalid; expected 3, 4, 6, or 8 hexadecimal digits...`
      )

    if (length === 4) hex = hex.replace(/([a-f\d])/g, '$1$1')

    return length === 4 || length === 8 ? parseInt(hex.slice(6, 8), 16) / RGB_MAX : 1
  },
  normalizeHex = (hex: string): string => {
    const HEX = 'hex:' as const,
      OKLCH = 'oklch:' as const

    if (hex.startsWith(HEX)) hex = hex.slice(HEX.length)
    else if (hex.startsWith(OKLCH)) hex = hex.slice(OKLCH.length)

    hex = hex.replace(/^#/, '').toLowerCase()
    const { length }: { length: number } = hex

    if (![3, 4, 6, 8].some(_length => length === _length) || !/^[a-f\d]+$/.test(hex))
      throw new Error(
        `The HEX color "${hex}" is invalid; expected 3, 4, 6, or 8 hexadecimal digits...`
      )

    if (length === 3 || length === 4) hex = hex.replace(/([a-f\d])/g, '$1$1')
    if (length === 8) hex = hex.slice(0, 6)

    return hex
  },
  toLinearSRgb = (c: number): number => {
    const v: number = c / RGB_MAX
    return v <= THRESHOLD ? v / SLOPE : ((v + OFFSET) / SCALE) ** GAMMA
  },
  hexToRgb = (hex: string): Color.Rgb => {
    const rgb: Color.Rgb = { r: 0, g: 0, b: 0 }

    for (const [index, color] of ['r', 'g', 'b'].entries())
      rgb[color as keyof Color.Rgb] = toLinearSRgb(
        parseInt(hex.slice(index * 2, index * 2 + 2), 16)
      )

    return rgb
  },
  rgbToOklch = ({ r, g, b }: Color.Rgb): Color.Oklch => {
    numberError({ r, g, b }, 'non-negative')

    const lms: Color.Lms = { l: 0, m: 0, s: 0 }

    for (const [key, { R, G, B }] of typedEntries(MATRIX_OF_RGB_TO_LMS))
      lms[key.toLowerCase() as keyof Color.Lms] = Math.cbrt(R * r + G * g + B * b)

    const oklab: Color.Oklab = { l: 0, a: 0, b: 0 }

    for (const [key, { L, M, S }] of typedEntries(MATRIX_OF_LMS_TO_OKLAB))
      oklab[key.toLowerCase() as keyof Color.Oklab] = L * lms.l + M * lms.m + S * lms.s

    const { a: _a, b: _b }: Color.Oklab = oklab

    let h: number = Math.atan2(_b, _a) * (180 / Math.PI)
    if (h < 0) h += 360

    return { l: oklab.l, c: Math.hypot(_a, _b), h }
  },
  round = (value: number, places: number): number => Number(value.toFixed(places)),
  hexToOklch = (hex: string): Color.Oklch => {
    const rawKey: string = cacheKey('hex', hex)
    if (cache.has(rawKey)) return cache.get(rawKey)!

    hex = normalizeHex(hex)
    const key: string = cacheKey('hex', hex)

    if (cache.has(key)) return cache.get(key)!

    const rgb: Color.Rgb = hexToRgb(hex),
      oklch: Color.Oklch = rgbToOklch(rgb)

    for (const [key, decimalPlace] of typedEntries({ l: 4, c: 4, h: 2 })) {
      const value: number = oklch[key]

      numberError({ [key]: value }, 'non-negative')

      const multiplier: number = 10 ** decimalPlace
      oklch[key as keyof Color.Oklch] = Math.round(value * multiplier) / multiplier
    }

    cache.set(key, oklch)
    return oklch
  }

/**
 * @param options.darker Must be a number between 0 and 1.
 * @param options.lighter Must be a number between 0 and 1.
 * @param options.chroma Must be a non-negative number.
 * @param options.alpha Must be a number between 0 and 1.
 */
export const oklch = (color: string, options?: Color.Ctx): string => {
  const { darker = 0, lighter = 0, chroma = 1, alpha = 1 }: Color.Ctx = options ?? {}
  numberError({ darker, lighter, alpha }, 'ratio')
  numberError({ chroma }, 'non-negative')

  if (darker > 0 && lighter > 0)
    throw new Error('Pass either "darker" or "lighter", as they cannot be used together...')

  color = color.trim()
  const offset: number = (lighter ?? 0) - (darker ?? 0)

  if (CSS_VAR.test(color))
    return `oklch(from ${color} clamp(0, l + ${offset}, 1) calc(c * ${chroma}) h / calc(alpha * ${alpha}))`

  let oklch: Color.Oklch, a: number

  if (/^oklch\(/i.test(color)) {
    const { a: _a, ...args }: Color.Oklch & { a: number } = parseOklch(color)
    oklch = args
    a = _a
    cache.set(cacheKey('oklch', color), args)
  } else {
    a = alphaFromHex(color)
    oklch = hexToOklch(color)
  }

  const { l, c, h }: Color.Oklch = oklch
  let lightness: number = Math.min(Math.max(l + offset, 0), 1)

  return `oklch(${round(lightness * 100, 2)}% ${round(c * chroma, 4)} ${h} / ${round(a * alpha, 4)})`
}
