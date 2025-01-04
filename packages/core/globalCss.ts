import { convertToArray } from './helpers'
import type { GlobalCss, GlobalCssContent, SingleOrArray } from './types'

let _globalCss: GlobalCss = new Array()

export const getGlobalCss = (): GlobalCss => _globalCss

export const ficsCss = (globalCss: SingleOrArray<GlobalCssContent | string>): void => {
  _globalCss = convertToArray(globalCss)
}
