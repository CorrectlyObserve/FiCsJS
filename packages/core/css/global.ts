import { unnestAtRules } from './unnest'

let globalCss: string = ''

export const configGlobalCss = (css: string): string => {
  globalCss = css
  return getGlobalCss()
}

/** @param isRaw - Set to true to defer hoisting */
export const getGlobalCss = ({ isRaw }: { isRaw?: boolean } = {}): string =>
  isRaw ? globalCss : unnestAtRules(globalCss)
