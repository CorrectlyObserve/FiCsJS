export const BASE_COLORS = {
  'bg-light': '#faf9f5',
  'bg-dark': '#0d1117',
  danger: '#c32e33',
  primary: '#0e66d8',
  success: '#16a34a',
  warning: '#edb333'
} as const

export const BACKGROUND_DELTAS = {
  sunken: { light: -0.03, dark: -0.03 },
  raised: { light: 0.02, dark: 0.04 }
} as const

export const LIGHTNESS_CLAMP = {
  text: [0.5, 0.66] as const,
  graphic: [0.6, 0.55] as const
} as const

export const RATIOS = { muted: 0.62, border: 0.44, divider: 0.15 } as const

export const TEXTS = { onDark: '#f7f8f8', onLight: '#141413' } as const
