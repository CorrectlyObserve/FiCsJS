// import { WelyElement } from '@/libs/class'
import { Css, Events, Define, Html, Html2, Slot, Wely } from '@/libs/types'
import { generator, insertElement, toKebabCase } from '@/libs/utils'

export const define = <T, D, P>({
  name,
  className,
  dependencies,
  inheritances,
  data,
  html,
  css,
  slot,
  events
}: Define<T, D, P>): Wely<D> => {
  const getWely = (name: string) => customElements.get(`w-${toKebabCase(name)}`)

  if (!getWely(name))
    customElements.define(
      `w-${toKebabCase(name)}`,
      class extends HTMLElement {
        readonly shadowRoot!: ShadowRoot
        readonly welyId: string = ''
        readonly dependencies: Wely<D>[] = []
        readonly inheritances: {
          descendants: HTMLElement | HTMLElement[]
          props: (data: D) => P
        }[] = []
        readonly slotContent: Slot<D, P>[] = []
        readonly eventHandlers: Events<D, P> = []

        #data: D = <D>{}
        #props: P = <P>{}
        #html: Html2<T, D, P>[] = []
        #css: Css<D, P> = []
        #inheritedSet: Set<HTMLElement> = new Set()

        constructor() {
          super()
          this.shadowRoot = this.attachShadow({ mode: 'open' })
          this.welyId = `wely-id${generator.next().value}`

          if (className)
            this.setAttribute(
              'class',
              className
                .split(' ')
                .reduce((prev, current) => `${prev} ${current}`, toKebabCase(name))
            )
          else this.classList.add(toKebabCase(name))

          if (dependencies)
            this.dependencies = Array.isArray(dependencies) ? [...dependencies] : [dependencies]

          if (inheritances) this.inheritances = [...inheritances]

          if (data) this.#data = { ...data() }

          this.#html.push(html)

          if (css && css.length > 0) this.#css = [...css]

          if (slot) this.slotContent.push(slot)

          if (events && events.length > 0) this.eventHandlers = [...events]
        }
      }
      // class extends WelyElement<T, D, P> {
      //   static create({ data: partialData } = { data: () => {} }): WelyElement<T, D, P> {
      //     const wely = <WelyElement<T, D, P>>document.createElement(welyName(name))
      //     const integratedData = <D>{
      //       ...(data ? data() : {}),
      //       ...(partialData ? partialData() : {})
      //     }

      //     wely.initialize({
      //       name,
      //       className,
      //       dependencies,
      //       inheritances,
      //       integratedData,
      //       html,
      //       css,
      //       slot,
      //       events
      //     })

      //     return wely
      //   }
      // }
    )

  return <Wely<D>>getWely(name)
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
