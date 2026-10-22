export type Theme = 'light' | 'dark'

export const THEME_KEY = 'theme' as const

export const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark'
