import FiCsElement from './class'
import type { Excluded, FiCs } from './types'

export default <D extends object, P extends object>({
  name,
  children,
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
  ws,
  sse
}: Omit<FiCs<D, P>, Excluded>): FiCsElement<D, P> =>
  new FiCsElement<D, P>({
    name,
    children,
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
    ws,
    sse
  })
