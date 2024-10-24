import type { GlobalCss, GlobalCssContent } from './types'

let _globalCss: GlobalCss = new Array()

export const getGlobalCss = (): GlobalCss => _globalCss

export const ficsCss = (globalCss: GlobalCssContent): void => {
  _globalCss = Array.isArray(globalCss)
    ? [...globalCss]
    : [typeof globalCss === 'string' ? globalCss : { ...globalCss }]
}
