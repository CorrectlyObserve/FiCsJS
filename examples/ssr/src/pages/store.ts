import { createState } from 'ficsjs/state'
import { isTheme, THEME_KEY, type Theme } from '@/domain/theme'

export const $theme = createState<Theme | null>(null, {
  sessionStorage: {
    key: THEME_KEY,
    validate: (value): value is Theme | null => value === null || isTheme(value)
  }
})

export const setTheme = (theme: Theme): void => {
  $theme.set(theme)
  document.documentElement.dataset.theme = theme
}

export const getTheme = (): Theme =>
  $theme.get() ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
