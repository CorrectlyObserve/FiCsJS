import { WelyClass } from './class'
import { Wely } from './types'

export const wely = <T, D, P>({
  name,
  className,
  inheritances,
  data,
  html,
  css,
  slot,
  events
}: Wely<T, D, P>) =>
  new WelyClass({
    welyId: undefined,
    name: name,
    className: className,
    inheritances: inheritances,
    data: data,
    html: html,
    css: css,
    slot: slot,
    events: events
  })

export const html = <T, D, P>(
  templates: TemplateStringsArray,
  ...variables: WelyClass<T, D, P>[]
): (WelyClass<T, D, P> | string)[] => {
  const result: (string | WelyClass<T, D, P>)[] = []
  let isSkipped: boolean = false

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i]
    const variable = variables[i]

    if (variable instanceof WelyClass || variable === undefined) {
      if (template !== '' && !isSkipped) result.push(template)
      if (variable !== undefined) result.push(variable)

      isSkipped = false
    } else {
      result.push(`${template}${variable}${templates[i + 1]}`)
      isSkipped = true
    }
  }

  return result
}
