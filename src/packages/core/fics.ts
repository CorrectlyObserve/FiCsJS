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
  actions
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
    actions
  })

export default fics
