import WelyElement from './class'
import symbol from './symbol'
import { Sanitized, Wely } from './types'

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
      const isWelyElement = variable instanceof WelyElement

      if (last instanceof WelyElement)
        isWelyElement ? result.push(template, variable) : result.push(`${template}${variable}`)
      else {
        result.splice(result.length - 1, 1, `${last}${template}${isWelyElement ? '' : variable}`)
        if (isWelyElement) result.push(variable)
      }
    }
  }

  return { [symbol]: <Sanitized<D, P>>result }
}

export const slot = (slot: string = ''): WelyElement<object, never> =>
  wely({ name: 'slot', html: html`${slot}` })

export const wely = <D extends object, P extends object>({
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
}: Wely<D, P>) =>
  new WelyElement({
    welyId: undefined,
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
