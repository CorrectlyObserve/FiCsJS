import FiCsElement from './class'
import symbol from './symbol'
import { Sanitized, FiCs } from './types'

export const html = <D extends object, P extends object>(
  templates: TemplateStringsArray,
  ...variables: unknown[]
): Record<symbol, Sanitized<D, P>> => {
  const result = new Array()

  for (const [index, template] of templates.entries()) {
    const sanitize = (arg: unknown): unknown =>
      typeof arg === 'string' && arg !== ''
        ? arg.replaceAll(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
        : arg ?? ''

    const variable = sanitize(variables[index])

    if (index === 0 && template === '') result.push(variable)
    else {
      const last = result[result.length - 1] ?? ''
      const isFiCsElement = variable instanceof FiCsElement
      const trimmed = template.trim()

      if (last instanceof FiCsElement)
        isFiCsElement ? result.push(trimmed, variable) : result.push(`${trimmed}${variable}`)
      else {
        result.splice(result.length - 1, 1, `${last}${trimmed}${isFiCsElement ? '' : variable}`)
        if (isFiCsElement) result.push(variable)
      }
    }
  }

  return { [symbol]: <Sanitized<D, P>>result }
}

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
