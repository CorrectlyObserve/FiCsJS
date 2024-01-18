import FiCsElement from './class'
import { FiCs } from './types'

export const fics = <D extends object, P extends object>({
  name,
  data,
  reflections,
  props,
  isOnlyCsr,
  className,
  html,
  css,
  actions
}: FiCs<D, P>): FiCsElement<D, P> =>
  new FiCsElement({
    name,
    data,
    reflections,
    props,
    isOnlyCsr,
    className,
    html,
    css,
    actions
  })
