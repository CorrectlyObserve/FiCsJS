import { Class } from './class'
import { HtmlSymbol,  } from './types'
import { symbol } from './utils'

export const html = <T, D, P>(
  templates: TemplateStringsArray,
  ...variables: (Class<T, D, P> | unknown)[]
): HtmlSymbol<T, D, P> => {
  const hasClass: boolean = variables.some(variable => variable instanceof Class)

  let isSkipped: boolean = false
  const arr: (Class<T, D, P> | string)[] = []
  let str: string = ''

  for (let i = 0; i < templates.length; i++) {
    const sanitize = (value: unknown) =>
      typeof value === 'string' && value !== ''
        ? value.replace(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
        : value
    const template = templates[i]
    const variable = sanitize(variables[i])

    if (hasClass) {
      if (variable instanceof Class || variable === undefined) {
        if (template !== '' && !isSkipped) arr.push(template)
        if (variable !== undefined) arr.push(variable)

        isSkipped = false
      } else {
        arr.push(`${template}${variable}${templates[i + 1]}`)
        isSkipped = true
      }
    } else str += `${template}${variable === undefined ? '' : variable}`
  }

  return { [symbol]: hasClass ? arr : [str] }
}

export const  = <T, D, P>({
  name,
  className,
  inheritances,
  data,
  html,
  css,
  ssrCss,
  slot,
  events
}: <T, D, P>) =>
  new Class({
    Id: undefined,
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
