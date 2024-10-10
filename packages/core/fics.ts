import FiCsElement from './class'
import { getGlobalCss } from './globalCss'
import type { FiCs } from './types'

export default <D extends object, P extends object>({
  name,
  isImmutable,
  data,
  inheritances,
  props,
  isOnlyCsr,
  className,
  attributes,
  html,
  css,
  actions,
  hooks
}: FiCs<D, P>): FiCsElement<D, P> =>
  new FiCsElement({
    name,
    isImmutable,
    data,
    inheritances,
    props,
    isOnlyCsr,
    className,
    attributes,
    html,
    css: css ? [...getGlobalCss(), ...css] : getGlobalCss(),
    actions,
    hooks
  })
