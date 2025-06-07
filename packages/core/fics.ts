import FiCsElement from './class'
import type { FiCs } from './types'

export default <D extends object, P extends object>({
  name,
  descendants,
  data,
  deferredData,
  props,
  className,
  attributes,
  html,
  css,
  hooks,
  actions,
  options,
  scroll,
  sse
}: Omit<FiCs<D, P>, 'isExceptional' | 'ficsId' | 'instanceId' | 'clonedCss'>): FiCsElement<D, P> =>
  new FiCsElement<D, P>({
    name,
    descendants,
    data,
    deferredData,
    props,
    className,
    attributes,
    html,
    css,
    hooks,
    actions,
    options,
    scroll,
    sse
  })
