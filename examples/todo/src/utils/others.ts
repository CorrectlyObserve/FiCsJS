import { oklch, remToPx } from 'ficsjs/style'

export const breakpoints = { sm: '30rem', lg: '60rem' } as const

export const getTimestamp = (): number => Date.now()

export const measureOffsetWidth = (): boolean =>
  document.documentElement.offsetWidth >= remToPx(breakpoints.lg)

export const white: string = oklch('#fff')
