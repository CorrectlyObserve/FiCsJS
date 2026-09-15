import { oklch, remToPx, size } from 'ficsjs/style'

export const breakpoints = { SM: size(120), LG: size(240) } as const

export const getTimestamp = (): number => Date.now()

export const measureOffsetWidth = (): boolean =>
  document.documentElement.offsetWidth >= remToPx(breakpoints.LG)

export const white = (opacity: number = 1) => oklch('#fff', { opacity })
