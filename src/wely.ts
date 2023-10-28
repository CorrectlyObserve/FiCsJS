import { Element } from './class'
import { HtmlSymbol,  } from './types'
import { sanitize, symbol } from './utils'

export const html = <T, D, P>(
  templates: TemplateStringsArray,
  ...variables: (Element<T, D, P> | unknown)[]
): HtmlSymbol<T, D, P> => {
  const wrapSanitize = (value: unknown) =>
    value === '' || value === undefined ? '' : typeof value === 'string' ? sanitize(value) : value

  if (variables.some(variable => variable instanceof Element)) {
    const result: (Element<T, D, P> | string)[] = []
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

export const  = <T, D, P>({
  name,
  className,
  inheritances,
  data,
  isOnlyCsr,
  html,
  css,
  ssrCss,
  csrSlot,
  events
}: <T, D, P>) =>
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
    csrSlot,
    events
  })
