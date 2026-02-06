import { browserError, numberError } from '../core/helpers'
import type { Color } from './types'

const CSS_VAR: RegExp = /^var\(\s*--([\w-]+)\s*(?:,\s*([^)]*))?\s*\)$/,
  MAX = 255 as const,
  THRESHOLD = 0.04045 as const,
  DIVISOR = 12.92 as const,
  OFFSET = 0.055 as const,
  SCALE = 1.055 as const,
  EXPONENT = 2.4 as const,
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
  convertCssVar = (str: string, seen: Set<string> = new Set()): string => {
    str = str.trim()

    const matchArray: RegExpMatchArray | null = str.match(CSS_VAR)
    if (!matchArray) return str

    browserError()

    const [, name, fallback]: RegExpMatchArray = matchArray,
      resolved: string = getComputedStyle(document.documentElement)
        .getPropertyValue(`--${name}`)
        .trim()

    if (seen.has(name)) {
      const cycle: string = [...seen, name].map(_name => `--${_name}`).join(' -> ')
      throw new Error(
        `A circular CSS variable reference was detected (${cycle}) while resolving "${str}"...`
      )
    }

    seen.add(name)

    if (resolved !== '') return convertCssVar(resolved, seen)

    const _fallback: string | undefined = fallback?.trim()
    if (_fallback) return convertCssVar(_fallback, seen)

    throw new Error(
      `The CSS variable "--${name}" is not defined and no fallback was provided in "${str}"...`
    )
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
  parseOklch = (literal: string): Color.Oklch & { a: number } => {
    const match: RegExpMatchArray | null = literal.trim().match(/^oklch\(\s*(.+)\s*\)$/i),
      OKLCH_LITERAL = '"oklch(<lightness> <chroma> <hue>[/ <alpha>])"' as const

    if (!match)
      throw new Error(`The oklch() literal "${literal}" must match the format ${OKLCH_LITERAL}...`)

    const parts: string[] = match[1].split(/\s+/).filter(Boolean)
    if (parts.length < 3)
      throw new Error(
        `The oklch() literal "${literal}" must contain at least three values (L C H) like ${OKLCH_LITERAL}...`
      )

    let [l, c, h, a]: (string | number)[] = parts
    l = l.endsWith('%') ? parseFloat(l) / 100 : parseFloat(l)
    c = parseFloat(c)
    h = parseFloat(h)
    a = a === undefined ? 1 : parseFloat(a)

    numberError({ l, c, h, a }, false)
    return { l, c, h, a }
  },
  alphaFromHex = (hex: string): number => {
    hex = hex.replace(/^#/, '').toLowerCase()
    const { length }: { length: number } = hex

    if (![3, 4, 6, 8].some(_length => length === _length) || !/^[a-f\d]+$/.test(hex))
      throw new Error(
        `The HEX color "${hex}" is invalid; expected 3, 4, 6, or 8 hexadecimal digits...`
      )

    if (length === 4) hex = hex.replace(/([a-f\d])/g, '$1$1')

    return length === 4 || length === 8 ? parseInt(hex.slice(6, 8), 16) / MAX : 1
  },
  toLinearSRgb = (c: number): number => {
    const v: number = c / MAX
    return v <= THRESHOLD ? v / DIVISOR : ((v + OFFSET) / SCALE) ** EXPONENT
  },
  hexToRgb = (hex: string): Color.Rgb => {
    hex = normalizeHex(convertCssVar(hex))
    const rgb: Color.Rgb = { r: 0, g: 0, b: 0 }

    for (const [index, color] of ['r', 'g', 'b'].entries())
      rgb[color as keyof Color.Rgb] = toLinearSRgb(
        parseInt(hex.slice(index * 2, index * 2 + 2), 16)
      )

    return rgb
  },
  rgbToOklch = ({ r, g, b }: Color.Rgb): Color.Oklch => {
    numberError({ r, g, b }, false)

    const lms: Color.Lms = { l: 0, m: 0, s: 0 }

    for (const [key, { R, G, B }] of Object.entries(MATRIX_OF_RGB_TO_LMS))
      lms[key.toLowerCase() as keyof Color.Lms] = Math.cbrt(R * r + G * g + B * b)

    const oklab: Color.Oklab = { l: 0, a: 0, b: 0 }

    for (const [key, { L, M, S }] of Object.entries(MATRIX_OF_LMS_TO_OKLAB))
      oklab[key.toLowerCase() as keyof Color.Oklab] = L * lms.l + M * lms.m + S * lms.s

    const { a: _a, b: _b }: Color.Oklab = oklab

    let h: number = Math.atan2(_b, _a) * (180 / Math.PI)
    if (h < 0) h += 360

    return { l: oklab.l, c: Math.hypot(_a, _b), h }
  },
  cacheKey = (type: 'hex' | 'oklch', key: string): string => `${type}:${key}`,
  hexToOklch = (hex: string): Color.Oklch => {
    const rawKey: string = cacheKey('hex', hex)
    if (cache.has(rawKey)) return cache.get(rawKey)!

    const normalizedHex: string = normalizeHex(convertCssVar(hex)),
      key: string = cacheKey('hex', normalizedHex)

    if (cache.has(key)) return cache.get(key)!

    const rgb: Color.Rgb = hexToRgb(normalizedHex),
      oklch: Color.Oklch = rgbToOklch(rgb)

    for (const [key, decimalPlace] of Object.entries({ l: 4, c: 4, h: 2 })) {
      const value: number = oklch[key as keyof Color.Oklch]

      numberError({ [key]: value }, false)

      const multiplier: number = 10 ** decimalPlace
      oklch[key as keyof Color.Oklch] = Math.round(value * multiplier) / multiplier
    }

    cache.set(key, oklch)
    return oklch
  }

export default (
  color: string,
  options?: {
    darker?: number
    lighter?: number
    chroma?: number
    opacity?: number
  }
): string => {
  const resolved: string = convertCssVar(color).trim()
  let oklch: Color.Oklch, alpha: number

  if (/^oklch\(/i.test(resolved)) {
    const { a, ...args } = parseOklch(resolved)
    oklch = args
    alpha = a
    cache.set(cacheKey('oklch', resolved), args)
  } else {
    alpha = alphaFromHex(resolved)
    oklch = hexToOklch(resolved)
  }

  const { darker = 0, lighter = 0, chroma = 1, opacity = 1 } = options ?? {}
  numberError({ darker, lighter, chroma, opacity }, false)

  if (darker > 0 && lighter > 0)
    throw new Error('Both "darker" and "lighter" options cannot be used at the same time...')

  let { l, c, h }: Color.Oklch = oklch

  if (darker > 0) l = Math.max(0, l - darker)
  else if (lighter > 0) l = Math.min(1, l + lighter)

  return `oklch(${l * 100}% ${c * chroma} ${h} / ${Math.max(0, Math.min(1, opacity * alpha))})`
}
