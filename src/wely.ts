import { Element } from './class'
import {  } from './types'
import { sanitize, symbol } from './utils'

export const html = <D, P>(
  templates: TemplateStringsArray,
  ...variables: (Element<D, P> | unknown)[]
): Record<symbol, (Element<D, P> | string)[]> => {
  const wrapSanitize = (arg: unknown) =>
    arg === '' || arg === undefined ? '' : typeof arg === 'string' ? sanitize(arg) : arg

  if (variables.some(variable => variable instanceof Element)) {
    const result = []
    let isSkipped = false

    for (const [i, template] of templates.entries()) {
      const variable = variables[i]

      if (variable instanceof Element || variable === undefined) {
        if (template !== '' && !isSkipped) result.push(template)
        if (variable !== undefined) result.push(variable)

        isSkipped = false
      } else {
        result.push(`${template}${wrapSanitize(variable)}${templates[i + 1]}`)
        isSkipped = true
      }
    }

    return { [symbol]: result }
  }

  return {
    [symbol]: [templates.reduce((prev, curr, i) => prev + curr + wrapSanitize(variables[i]), '')]
  }
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
