import { FiCsElement } from './class'
import { convertStr, isBlankString } from './helpers'
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
}: Omit<
  FiCs<D, P>,
  'instanceId' | 'clonedName' | 'isCloned' | 'immutableDataKeys' | 'clonedCss'
>): FiCsElement<D, P> => {
  name = convertStr(name.trim(), 'kebab')

  if (isBlankString(name)) throw new Error('The FiCsElement name must be a non-empty string...')

  if (!/^[a-z\d]+(?:-[a-z\d]+)*$/.test(name))
    throw new Error(
      'The FiCsElement name must contain only lowercase letters, numbers, and single hyphens...'
    )

  return new FiCsElement<D, P>({
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
}
