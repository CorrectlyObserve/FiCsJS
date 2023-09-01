import { WelyClass } from '@/class'
import { Wely } from '@/types'

export const wely = <T, D, P>({
  name,
  className,
  dependencies,
  inheritances,
  data,
  html,
  css,
  slot,
  events
}: Wely<T, D, P>) =>
  new WelyClass({
    name,
    className,
    dependencies,
    inheritances,
    data,
    html,
    css,
    slot,
    events
  })

export const html = <T, D, P>(
  templates: TemplateStringsArray,
  ...classes: WelyClass<T, D, P>[]
) =>
  Array.from({ length: Math.max(templates.length, classes.length) }, (_, index) => {
    const result = []

    if (index < templates.length) result.push(templates[index])
    if (index < classes.length) result.push(classes[index])

    return result
  }).flat()
