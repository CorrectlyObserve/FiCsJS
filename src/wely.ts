import { Element } from './class'
import { Variables,  } from './types'
import { sanitize, symbol } from './utils'

export const html = <D, P>(
  templates: TemplateStringsArray,
  ...variables: (Variables<D, P> | unknown)[]
): Record<symbol, Variables<D, P>[]> => {
  const result = []

  for (const [index, template] of templates.entries()) {
    const variable = sanitize(variables[index]) ?? ''

    if (index === 0 && template === '') result.push(variable)
    else {
      const lastValue: Variables<D, P> | unknown = result[result.length - 1] ?? ''

      if (lastValue instanceof Element)
        variable instanceof Element
          ? result.push(template, variable)
          : result.push(`${template}${variable}`)
      else {
        result.splice(
          result.length - 1,
          1,
          `${lastValue}${template}${variable instanceof Element ? '' : variable}`
        )
        if (variable instanceof Element) result.push(variable)
      }
    }
  }

  return { [symbol]: <Variables<D, P>[]>result }
}

export const slot = (slot?: string): Element<never, never> =>
  ({ name: '-slot', html: { [symbol]: [slot ?? ''] } })

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
