import { FiCsElement } from './class'
import { cssToString } from './css'
import { toArray } from './helpers'
import type { SingleOrArray } from './types'

export const configGlobalCss = (css: SingleOrArray<string>): string => {
  FiCsElement.globalCss = toArray(css)
  return getGlobalCss()
}

export const getGlobalCss = (): string => cssToString(FiCsElement.globalCss)
