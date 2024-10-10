import type { GlobalCss } from './types'

let _globalCss: GlobalCss = new Array()

export const getGlobalCss = (): GlobalCss => _globalCss

export const globalCss = (params: GlobalCss): void => {
  _globalCss = [...params]
}
