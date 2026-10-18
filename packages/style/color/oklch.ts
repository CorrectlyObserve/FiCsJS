import { numberError, typedEntries } from '../../core/helpers'
import type { Color } from '../types'
import { CSS_VAR, MATRIX_OF_RGB_TO_LMS, MATRIX_OF_LMS_TO_OKLAB } from './constants'
import { hexToRatio, hexToRgb } from './helpers'

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

    return length === 4 || length === 8 ? hexToRatio(hex.slice(6, 8)) : 1
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

    const oklch: Color.Oklch = rgbToOklch(hexToRgb(hex))

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
  if (CSS_VAR.test(color))
    return `oklch(from ${color} clamp(0, l + ${lighter - darker}, 1) calc(c * ${chroma}) h / calc(alpha * ${alpha}))`

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

  const { l, c, h }: Color.Oklch = oklch,
    lightness: number = Math.min(Math.max(l + lighter - darker, 0), 1)

  return `oklch(${round(lightness * 100, 2)}% ${round(c * chroma, 4)} ${h} / ${round(a * alpha, 4)})`
}
