import type { GlobalCss } from './types'

let _globalCss: GlobalCss = new Array()

export const getGlobalCss = (): GlobalCss => _globalCss

export const globalCss = (param: GlobalCss): void => {
  _globalCss = [...param]
}
