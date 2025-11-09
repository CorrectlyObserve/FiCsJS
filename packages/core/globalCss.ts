import { toArray } from './helpers'
import type { GlobalCss, SingleOrArray } from './types'

let _globalCss: GlobalCss[] = new Array()

export const ficsCss = (css: SingleOrArray<GlobalCss>): void => {
  _globalCss = toArray(css)
}

export const globalCss = (): GlobalCss[] => _globalCss
