import { FiCsElement } from './class'
import { cssToString } from './css'
import { toArray } from './helpers'
import type { Css, SingleOrArray } from './types'

export const configGlobalCss = (css: SingleOrArray<Css.Global>): string => {
  FiCsElement.globalCss = toArray(css)
  return cssToString(FiCsElement.globalCss)
}
