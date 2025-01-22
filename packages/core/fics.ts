import FiCsElement from './class'
import type { FiCs } from './types'

export default <D extends object, P extends object>({
  name,
  data,
  fetch,
  props,
  className,
  attributes,
  html,
  css,
  actions,
  hooks,
  options
}: Omit<FiCs<D, P>, 'isExceptional' | 'clonedCss'>): FiCsElement<D, P> =>
  new FiCsElement<D, P>({
    name,
    isExceptional: false,
    data,
    fetch,
    props,
    className,
    attributes,
    html,
    css,
    actions,
    hooks,
    options
  })
