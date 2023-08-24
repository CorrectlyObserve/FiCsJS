// import { WelyElement } from '@/libs/class'
import { Define, DefineArgs, Html, Wely } from '@/libs/types'
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
  const welyName = `w-${toKebabCase(name)}`
  const getWely = () => customElements.get(welyName)

  const args: DefineArgs<T, D, P> = {
    dependencies: [],
    inheritances: [],
    data: <D>{},
    props: <P>{},
    html: [],
    css: [],
    inheritedSet: new Set(),
    slot: [],
    events: []
  }

  if (dependencies)
    args.dependencies = Array.isArray(dependencies) ? [...dependencies] : [dependencies]

  if (inheritances) args.inheritances = [...inheritances]
  if (data) args.data = { ...data() }

  args.html.push(html)

  if (css && css.length > 0) args.css = [...css]
  if (slot) args.slot.push(slot)
  if (events && events.length > 0) args.events = [...events]

  if (!getWely())
    customElements.define(
      welyName,
      class extends HTMLElement {
        readonly shadowRoot!: ShadowRoot
        readonly welyId: string = ''

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
        }

        static overwrite(data: () => Partial<D>) {
          args.data = <D>{ ...args.data, ...data() }
          return getWely()
        }

        static instantiate(): HTMLElement {
          console.log(args.html, args.data)
          const wely = document.createElement(welyName)
          return wely
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

  return <Wely<D>>getWely()
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
