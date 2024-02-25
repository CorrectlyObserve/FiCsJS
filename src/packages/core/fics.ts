import FiCsElement from './class'
import { FiCs } from './types'
import { toKebabCase } from './utils'

const fics = <D extends object, P extends object>({
  name,
  data,
  reflections,
  inheritances,
  props,
  isOnlyCsr,
  className,
  html,
  css,
  actions
}: FiCs<D, P>): FiCsElement<D, P> => {
  if ({ var: true, iframe: true }[toKebabCase(name)])
    throw new Error(`${name} is a reserved word in FiCsJS...`)
  else
    return new FiCsElement({
      name,
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
}

export default fics
