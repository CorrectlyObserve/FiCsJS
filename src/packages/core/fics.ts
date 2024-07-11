import FiCsElement from './class'
import type { FiCs } from './types'

const fics = <D extends object, P extends object>({
  name,
  isImmutable,
  data,
  reflections,
  inheritances,
  props,
  isOnlyCsr,
  className,
  html,
  css,
  slots,
  actions,
  hooks
}: FiCs<D, P>): FiCsElement<D, P> =>
  new FiCsElement({
    name,
    isImmutable,
    data,
    reflections,
    inheritances,
    props,
    isOnlyCsr,
    className,
    html,
    css,
    slots,
    actions,
    hooks
  })

export default fics
