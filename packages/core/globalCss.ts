import FiCsElement from './class'
import { toArray } from './helpers'
import type { GlobalCss, SingleOrArray } from './types'

export default (css: SingleOrArray<GlobalCss>): void => {
  FiCsElement.globalCss = toArray(css)
}
