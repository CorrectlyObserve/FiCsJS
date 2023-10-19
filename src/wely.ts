import { WelyClass } from './class'
import { HtmlSymbol, Wely } from './types'
import { symbol } from './utils'

export const html = <T, D, P>(
  templates: TemplateStringsArray,
  ...variables: (WelyClass<T, D, P> | unknown)[]
): HtmlSymbol<T, D, P> => {
  const hasWelyClass: boolean = variables.some(variable => variable instanceof WelyClass)

  let isSkipped: boolean = false
  const arr: (WelyClass<T, D, P> | string)[] = []
  let str: string = ''

  for (let i = 0; i < templates.length; i++) {
    const sanitize = (value: unknown) =>
      typeof value === 'string' && value !== ''
        ? value.replace(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
        : value
    const template = templates[i]
    const variable = sanitize(variables[i])

    if (hasWelyClass) {
      if (variable instanceof WelyClass || variable === undefined) {
        if (template !== '' && !isSkipped) arr.push(template)
        if (variable !== undefined) arr.push(variable)

        isSkipped = false
      } else {
        arr.push(`${template}${variable}${templates[i + 1]}`)
        isSkipped = true
      }
    } else str += `${template}${variable === undefined ? '' : variable}`
  }

  return { [symbol]: hasWelyClass ? arr : [str] }
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
