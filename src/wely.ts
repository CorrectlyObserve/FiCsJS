import { Element } from './class'
import {  } from './types'
import { sanitize, symbol } from './utils'

export const html = <D, P>(
  templates: TemplateStringsArray,
  ...variables: (Element<D, P> | unknown)[]
): Record<symbol, (Element<D, P> | string)[]> => {
  const result = []

  for (const [index, template] of templates.entries()) {
    const variable = sanitize(variables[index]) ?? ''

    if (index === 0 && template === '') result.push(variable)
    else {
      const last: Element<D, P> | string | unknown = result[result.length - 1] ?? ''

      if (last instanceof Element)
        variable instanceof Element
          ? result.push(template, variable)
          : result.push(`${template}${variable}`)
      else result.splice(result.length - 1, 1, `${last}${template}${variable}`)
    }
  }

  return { [symbol]: <(Element<D, P> | string)[]>result }
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
