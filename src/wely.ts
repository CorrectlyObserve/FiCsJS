import { Element } from './class'
import { HtmlSymbol,  } from './types'
import { sanitize, symbol } from './utils'

export const html = <T, D, P>(
  templates: TemplateStringsArray,
  ...variables: (Element<T, D, P> | unknown)[]
): HtmlSymbol<T, D, P> => {
  const sanitizeStr = (value: unknown) =>
    typeof value === 'string' && value !== '' ? sanitize(value) : value

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
        result.push(`${template}${sanitizeStr(variable)}${templates[i + 1]}`)
        isSkipped = true
      }
    }

    return { [symbol]: result }
  }

  return {
    [symbol]: [
      templates.reduce((prev, current, index) => prev + current + sanitizeStr(variables[index]), '')
    ]
  }
}

export const  = <T, D, P>({
  name,
  className,
  inheritances,
  data,
  html,
  ssrHtml,
  css,
  ssrCss,
  slot,
  events
}: <T, D, P>) =>
  new Element({
    Id: undefined,
    name,
    className,
    inheritances,
    data,
    html,
    ssrHtml,
    css,
    ssrCss,
    slot,
    events
  })
