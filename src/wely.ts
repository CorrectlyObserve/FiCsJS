import { WelyElement } from './class'
import { Variables, Wely } from './types'
import { sanitize, symbol } from './utils'

export const html = <D, P>(
  templates: TemplateStringsArray,
  ...variables: (Variables<D, P> | unknown)[]
): Record<symbol, Variables<D, P>[]> => {
  const result = []

  for (const [index, template] of templates.entries()) {
    const variable = sanitize(variables[index]) ?? ''

    if (index === 0 && template === '') result.push(variable)
    else {
      const lastValue: Variables<D, P> | unknown = result[result.length - 1] ?? ''

      if (lastValue instanceof WelyElement)
        variable instanceof WelyElement
          ? result.push(template, variable)
          : result.push(`${template}${variable}`)
      else {
        result.splice(
          result.length - 1,
          1,
          `${lastValue}${template}${variable instanceof WelyElement ? '' : variable}`
        )
        if (variable instanceof WelyElement) result.push(variable)
      }
    }
  }

  return { [symbol]: <Variables<D, P>[]>result }
}

export const slot = (slot?: string): WelyElement<never, never> =>
  wely({ name: 'wely-slot', html: { [symbol]: [slot ?? ''] } })

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
