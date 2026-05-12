import FiCsElement from './class'
import { toArray } from './helpers'
import type { Css, SingleOrArray } from './types'

export const configGlobalCss = (css: SingleOrArray<Css.Global>): void => {
  FiCsElement.globalCss = toArray(css)
}
