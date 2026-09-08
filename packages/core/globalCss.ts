import { FiCsElement } from './class'
import { cssToString } from './css'

export const configGlobalCss = (css: string): string => {
  FiCsElement.globalCss = css
  return getGlobalCss()
}

export const getGlobalCss = (): string => cssToString([FiCsElement.globalCss])
