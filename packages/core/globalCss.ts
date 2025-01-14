import { convertToArray } from './helpers'
import type { GlobalCssContent, SingleOrArray } from './types'

let globalCss: (GlobalCssContent | string)[] = new Array()

export const getGlobalCss = (): (GlobalCssContent | string)[] => globalCss

export const ficsGlobalCss = (css: SingleOrArray<GlobalCssContent | string>): void => {
  globalCss = convertToArray(css)
}
