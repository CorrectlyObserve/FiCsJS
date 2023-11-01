import { Element } from './class'
import { HtmlValue,  } from './types'
import { sanitize, symbol } from './utils'

export const html = <D, P>(
  templates: TemplateStringsArray,
  ...variables: (Element<D, P> | unknown)[]
): Record<symbol, HtmlValue<D, P>> => {
  const wrapSanitize = (value: unknown) =>
    value === '' || value === undefined ? '' : typeof value === 'string' ? sanitize(value) : value

  if (variables.some(variable => variable instanceof Element)) {
    const result: HtmlValue<D, P> = []
    let isSkipped: boolean = false

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i]
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
    [symbol]: [
      templates.reduce((prev, curr, index) => prev + curr + wrapSanitize(variables[index]), '')
    ]
  }
}

export const  = <D, P>({
  name,
  className,
  inheritances,
  data,
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
    inheritances,
    data,
    isOnlyCsr,
    html,
    css,
    ssrCss,
    slot,
    events
  })
