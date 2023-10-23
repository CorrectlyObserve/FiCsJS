import { WelyClass } from './class'
import { HtmlSymbol, Wely } from './types'
import { symbol } from './utils'

export const html = <T, D, P>(
  templates: TemplateStringsArray,
  ...variables: (WelyClass<T, D, P> | unknown)[]
): HtmlSymbol<T, D, P> => {
  const sanitize = (value: unknown) =>
    typeof value === 'string' && value !== ''
      ? value.replace(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
      : value

  if (variables.some(variable => variable instanceof WelyClass)) {
    const result: (WelyClass<T, D, P> | string)[] = []
    let isSkipped: boolean = false

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i]
      const variable = variables[i]

      if (variable instanceof WelyClass || variable === undefined) {
        if (template !== '' && !isSkipped) result.push(template)
        if (variable !== undefined) result.push(variable)

        isSkipped = false
      } else {
        result.push(`${template}${sanitize(variable)}${templates[i + 1]}`)
        isSkipped = true
      }
    }

    return { [symbol]: result }
  }

  return {
    [symbol]: [
      templates.reduce(
        (prev, current, index) => prev + current + (sanitize(variables[index]) ?? ''),
        ''
      )
    ]
  }
}

export const wely = <T, D, P>({
  name,
  className,
  inheritances,
  data,
  html,
  css,
  ssrCss,
  slot,
  events
}: Wely<T, D, P>) =>
  new WelyClass({
    welyId: undefined,
    name,
    className,
    inheritances,
    data,
    html,
    css,
    ssrCss,
    slot,
    events
  })
