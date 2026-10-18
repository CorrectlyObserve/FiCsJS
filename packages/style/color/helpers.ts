import { GAMMA, OFFSET, RGB_MAX, SLOPE, SCALE, THRESHOLD } from './constants'

const parseHex = (hex: string): number => parseInt(hex, 16)

export const hexToRatio = (hex: string): number => parseHex(hex) / RGB_MAX,
  toLinearSRgb = (hex: string): number => {
    const v: number = hexToRatio(hex)
    return v <= THRESHOLD ? v / SLOPE : ((v + OFFSET) / SCALE) ** GAMMA
  }
