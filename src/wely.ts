import { Element } from '@/libs/class'
import { Constructor, Define, Html } from '@/libs/types'
import { generator, insertElement, toKebabCase } from '@/libs/utils'

export const define = <T, D, P>({
  name,
  className,
  data,
  html,
  css,
  slot,
  events
}: Define<T, D, P>): Constructor<D> => {
  const Name = (name: string): string => `w-${toKebabCase(name)}`

  if (!customElements.get(Name(name)))
    customElements.define(
      Name(name),
      class extends Element<T, D, P> {
        static create(
          { data: partialData, inheritances: inheritances } = { data: () => {}, inheritances: [] }
        ): Element<T, D, P> {
          const  = <Element<T, D, P>>document.createElement(Name(name))
          const integratedData = <D>{
            ...(data ? data() : {}),
            ...(partialData ? partialData() : {})
          }

          .initialize({
            name,
            className,
            integratedData,
            inheritances,
            html,
            css,
            slot,
            events
          })

          return 
        }
      }
    )

  return <Constructor<D>>customElements.get(Name(name))
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
