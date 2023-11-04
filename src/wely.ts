import { WelyElement } from './class'
import { SanitizedHtml, Variables, Wely } from './types'
import { sanitize, symbol } from './utils'

export const html = <D, P>(
  templates: TemplateStringsArray,
  ...variables: (Variables<D, P> | unknown)[]
): SanitizedHtml<D, P> => {
  const result = []

  for (const [index, template] of templates.entries()) {
    const variable = sanitize(variables[index]) ?? ''

    if (index === 0 && template === '') result.push(variable)
    else {
      const last: Variables<D, P> | unknown = result[result.length - 1] ?? ''

      if (last instanceof WelyElement)
        variable instanceof WelyElement
          ? result.push(template, variable)
          : result.push(`${template}${variable}`)
      else result.splice(result.length - 1, 1, `${last}${template}${variable}`)
    }
  }

  return { [symbol]: <Variables<D, P>[]>result }
}

export const slot = (name?: string): WelyElement<never, never> => {
  const localName = name ? `-${name}` : ''
  return wely({ name: `slot-${localName}`, html: html`<w-var>wely-slot${localName}</w-var>` })
}

export const wely = <D, P>({
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
}: Wely<D, P>) =>
  new WelyElement({
    welyId: undefined,
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
