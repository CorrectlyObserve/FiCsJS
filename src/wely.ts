import { Element } from './class'
import { SanitizedHtml, Variables,  } from './types'
import { sanitize, symbol } from './utils'

export const html = <D, P>(
  templates: TemplateStringsArray,
  ...variables: (Variables<D, P> | unknown)[]
): SanitizedHtml<D, P> => {
  const result = []

  for (const [index, template] of templates.entries()) {
    const variable = sanitize(variables[index]) ?? ''

    if (index === 0 && template === '') result.push(variable)
    else {
      const last: Variables<D, P> | unknown = result[result.length - 1] ?? ''

      if (last instanceof Element)
        variable instanceof Element
          ? result.push(template, variable)
          : result.push(`${template}${variable}`)
      else result.splice(result.length - 1, 1, `${last}${template}${variable}`)
    }
  }

  return { [symbol]: <Variables<D, P>[]>result }
}

export const slot = (name?: string): Element<never, never> => {
  const localName = name ? `-${name}` : ''
  return ({ name: `slot-${localName}`, html: html`<w-var>-slot${localName}</w-var>` })
}

export const  = <D, P>({
  name,
  className,
  data,
  props,
  isOnlyCsr,
  html,
  css,
  ssrCss,
  slot,
  events
}: <D, P>) =>
  new Element({
    Id: undefined,
    name,
    className,
    data,
    props,
    isOnlyCsr,
    html,
    css,
    ssrCss,
    slot,
    events
  })
