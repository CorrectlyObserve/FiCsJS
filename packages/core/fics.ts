import { FiCsElement } from './class'
import type { FiCs } from './types'

export const fics = <D extends object, P extends object>({
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
  options
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
    options
  })
