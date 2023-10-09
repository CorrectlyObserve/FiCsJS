import { Class } from './class'
import {  } from './types'

export const html = <T, D, P>(
  templates: TemplateStringsArray,
  ...variables: (Class<T, D, P> | unknown)[]
): (Class<T, D, P> | string)[] => {
  const result: (string | Class<T, D, P>)[] = []
  let isSkipped: boolean = false

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i]
    let variable = variables[i]

    if (variable instanceof Class || variable === undefined) {
      if (template !== '' && !isSkipped) result.push(template)
      if (variable !== undefined) result.push(variable)

      isSkipped = false
    } else {
      if (typeof variable === 'string')
        variable = variable.replace(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))

      result.push(`${template}${variable}${templates[i + 1]}`)
      isSkipped = true
    }
  }

  return result
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
