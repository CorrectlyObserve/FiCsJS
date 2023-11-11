import Element from './class'
import { Sanitized,  } from './types'
import { symbol } from './utils'

export const html = <D, P>(
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

export const slot = (slot: string = ''): Element<never, never> =>
  ({ name: '-slot', html: html`${slot}` })

export const  = <D, P>({
  name,
  data,
  props,
  isOnlyCsr,
  className,
  html,
  slot,
  css,
  ssrCss,
  events
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
    ssrCss,
    events
  })
