import { WelyElement } from '@/libs/class'
import { Wely, Define, Html } from '@/libs/types'
import { generator, insertElement, toKebabCase } from '@/libs/utils'

export const define = <T, D, P>({
  name,
  className,
  data,
  html,
  css,
  slot,
  events,
  inheritances
}: Define<T, D, P>): Wely<D> => {
  const welyName = (name: string): string => `w-${toKebabCase(name)}`

  if (!customElements.get(welyName(name)))
    customElements.define(
      welyName(name),
      class extends WelyElement<T, D, P> {
        static create({ data: partialData } = { data: () => {} }): WelyElement<T, D, P> {
          const wely = <WelyElement<T, D, P>>document.createElement(welyName(name))
          const integratedData = <D>{
            ...(data ? data() : {}),
            ...(partialData ? partialData() : {})
          }

          wely.initialize({
            name,
            className,
            integratedData,
            inheritances,
            html,
            css,
            slot,
            events
          })

          return wely
        }
      }
    )

  return <Wely<D>>customElements.get(welyName(name))
}

export const html = (
  templates: TemplateStringsArray,
  ...elements: (HTMLElement | unknown)[]
): DocumentFragment => {
  let html: string = ''
  const generatedId = generator.next().value

  templates.forEach((template, index) => {
    html += template

    if (index !== templates.length - 1)
      html +=
        elements[index] instanceof HTMLElement
          ? `<w-var id="placeholder-id${generatedId}-${index}"></w-var>`
          : elements[index]
  })

  const dom = new DOMParser().parseFromString(html, 'text/html').body
  const fragment = new DocumentFragment()
  while (dom.firstChild) fragment.appendChild(dom.firstChild)

  elements.forEach((element, index) => {
    if (element instanceof HTMLElement) {
      const placeholder = fragment.getElementById(`placeholder-id${generatedId}-${index}`)

      if (placeholder) placeholder.replaceWith(element)
      else throw Error(`The element with an applicable id is not found...`)
    }
  })

  return fragment
}

export const mount = (parentId: string, child: Html): void => {
  const parent = document.getElementById(parentId)
  if (parent) insertElement(parent, child)
}
