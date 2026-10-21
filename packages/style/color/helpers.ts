import { GAMMA, OFFSET, RGB_MAX, SLOPE, SCALE, THRESHOLD } from './constants'
import type { Color } from './types'

const parseHex = (hex: string): number => parseInt(hex, 16)

export const hexToRatio = (hex: string): number => parseHex(hex) / RGB_MAX,
  hexToRgb = (hex: string): Color.Rgb => {
    const [r = 0, g = 0, b = 0] = (hex.match(/\w\w/g) || []).map(channel => {
      const v: number = hexToRatio(channel)
      return v <= THRESHOLD ? v / SLOPE : ((v + OFFSET) / SCALE) ** GAMMA
    })

    return { r, g, b }
  }

export const isLightTone = (tone: Color.Tone): boolean => tone === 'light'