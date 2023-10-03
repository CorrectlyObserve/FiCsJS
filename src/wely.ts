import { Class } from './class'
import {  } from './types'

export const  = <T, D, P>({
  name,
  className,
  inheritances,
  data,
  html,
  css,
  slot,
  events,
  ssr
}: <T, D, P>) =>
  new Class({
    Id: undefined,
    name,
    className,
    inheritances,
    data,
    html,
    css,
    slot,
    events,
    ssr
  })

export const html = <T, D, P>(
  templates: TemplateStringsArray,
  ...variables: Class<T, D, P>[]
): (Class<T, D, P> | string)[] => {
  const result: (string | Class<T, D, P>)[] = []
  let isSkipped: boolean = false

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i]
    const variable = variables[i]

    if (variable instanceof Class || variable === undefined) {
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
