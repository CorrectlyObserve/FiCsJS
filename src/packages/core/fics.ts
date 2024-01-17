import FiCsElement from './class'
import symbol from './symbol'
import { FiCs, Sanitized } from './types'

export const html = <D extends object, P extends object>(
  templates: TemplateStringsArray,
  ...variables: unknown[]
): Record<symbol, Sanitized<D, P>> => {
  const result: (Sanitized<D, P> | unknown)[] = new Array()

  for (const [index, template] of templates.entries()) {
    const trimmed: string = template.trim()
    const sanitize = (arg: unknown): Sanitized<D, P> | unknown =>
      typeof arg === 'string' && arg !== ''
        ? arg.replaceAll(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
        : arg ?? ''

    const variable: Sanitized<D, P> | unknown = sanitize(variables[index])

    if (index === 0 && template === '') result.push(variable)
    else {
      const last: Sanitized<D, P> | unknown = result[result.length - 1] ?? ''
      const isFiCsElement: boolean = variable instanceof FiCsElement

      if (last instanceof FiCsElement)
        isFiCsElement ? result.push(trimmed, variable) : result.push(`${trimmed}${variable}`)
      else {
        result.splice(result.length - 1, 1, `${last}${trimmed}${isFiCsElement ? '' : variable}`)
        if (isFiCsElement) result.push(variable)
      }
    }
  }

  return { [symbol]: result as Sanitized<D, P> }
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
