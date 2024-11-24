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
}: FiCs<D, P>): FiCsElement<D, P> =>
  new FiCsElement<D, P>({
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
  })
