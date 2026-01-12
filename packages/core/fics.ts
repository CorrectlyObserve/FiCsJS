import FiCsElement from './class'
import type { FiCs } from './types'

export default <D extends object, P extends object>({
  name,
  children,
  data,
  deferredData,
  i18nData,
  props,
  className,
  attributes,
  html,
  css,
  hooks,
  actions,
  options,
  scroll
}: Omit<FiCs<D, P>, 'isExceptional' | 'instanceId' | 'clonedCss'>): FiCsElement<D, P> =>
  new FiCsElement<D, P>({
    name,
    children,
    data,
    deferredData,
    i18nData,
    props,
    className,
    attributes,
    html,
    css,
    hooks,
    actions,
    options,
    scroll
  })
