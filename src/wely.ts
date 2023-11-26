import Element from './class'
import symbol from './symbol'
import { Sanitized,  } from './types'

export const html = <D extends object, P extends object>(
  templates: TemplateStringsArray,
  ...variables: unknown[]
): Record<symbol, Sanitized<D, P>> => {
  const result = []

  for (const [index, template] of templates.entries()) {
    const sanitize = (arg: unknown): unknown =>
      typeof arg === 'string' && arg !== ''
        ? arg.replaceAll(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
        : arg ?? ''

    const variable = sanitize(variables[index])

    if (index === 0 && template === '') result.push(variable)
    else {
      const last = result[result.length - 1] ?? ''
      const isElement = variable instanceof Element

      if (last instanceof Element)
        isElement ? result.push(template, variable) : result.push(`${template}${variable}`)
      else {
        result.splice(result.length - 1, 1, `${last}${template}${isElement ? '' : variable}`)
        if (isElement) result.push(variable)
      }
    }
  }

  return { [symbol]: <Sanitized<D, P>>result }
}

export const slot = (slot: string = ''): Element<object, never> =>
  new Element({ Id: 'slot', name: 'slot', html: html`${slot}` })

export const  = <D extends object, P extends object>({
  name,
  data,
  props,
  isOnlyCsr,
  className,
  html,
  slot,
  css,
  events,
  reflections
}: <D, P>) =>
  new Element({
    Id: undefined,
    name,
    data,
    props,
    isOnlyCsr,
    className,
    html,
    slot,
    css,
    events,
    reflections
  })
