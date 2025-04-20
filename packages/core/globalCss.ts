import { toArray } from './helpers'
import type { GlobalCssContent, SingleOrArray } from './types'

let _globalCss: (GlobalCssContent | string)[] = new Array()

export const ficsCss = (css: SingleOrArray<GlobalCssContent | string>): void => {
  _globalCss = toArray(css)
}

export const globalCss = (): (GlobalCssContent | string)[] => _globalCss
