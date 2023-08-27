import { Css, Define, Events, Html2, Inheritances, Slot } from '@/libs/types'
import { generator, toKebabCase } from '@/libs/utils'

export const createWely = <T, D, P>({
  name,
  className,
  dependencies,
  inheritances,
  data,
  html,
  css,
  slot,
  events
}: Define<T, D, P>) =>
  class {
    readonly #name: string = ''
    readonly #className: string = ''
    readonly #dependencies: CustomElementConstructor[] = []
    readonly #inheritances: Inheritances<D, P> = []
    readonly #data: D = <D>{}
    readonly #html: Html2<T, D, P>[] = []
    readonly #css: Css<D, P> = []
    readonly #slot: Slot<D, P>[] = []
    readonly #events: Events<D, P> = []
    readonly #partialData: Partial<D> = {}

    constructor(partialData?: () => Partial<D>) {
      this.#name = `w-${toKebabCase(name)}`

      if (className) this.#className = className

      if (dependencies)
        this.#dependencies = Array.isArray(dependencies) ? [...dependencies] : [dependencies]

      if (inheritances) this.#inheritances = [...inheritances]

      if (partialData) this.#partialData = { ...partialData() }
      if (data) this.#data = { ...data(), ...this.#partialData }

      this.#html = [html]

      if (css) this.#css = [...css]
      if (slot) this.#slot = [slot]
      if (events) this.#events = [...events]
    }

    define() {
      const welyClass = this
      const getWely = () => customElements.get(welyClass.#name)

      if (!getWely())
        customElements.define(
          welyClass.#name,
          class extends HTMLElement {
            readonly shadowRoot!: ShadowRoot
            readonly welyId: string = ''
            #inheritedSet: Set<CustomElementConstructor> = new Set()
            #props: P = <P>{}

            constructor() {
              super()
              this.shadowRoot = this.attachShadow({ mode: 'open' })
              this.welyId = `wely-id${generator.next().value}`

              if (welyClass.#className)
                this.setAttribute(
                  'class',
                  welyClass.#className
                    .split(' ')
                    .reduce((prev, current) => `${prev} ${current}`, welyClass.#name)
                )
              else this.classList.add(welyClass.#name)
            }

            connectedCallback() {
              console.log(welyClass.#data)
            }
          }
        )

      return <CustomElementConstructor>getWely()
    }
  }

// export const define = <T, D, P>({
//   name,
//   className,
//   dependencies,
//   inheritances,
//   data,
//   html,
//   css,
//   slot,
//   events
// }: Define<T, D, P>): WelyElement<D> => {
//   const welyName = `w-${toKebabCase(name)}`
//   const getWely = () => <WelyElement<D>>customElements.get(welyName)

//   const args: DefineArgs<T, D, P> = {
//     dependencies: dependencies ? (Array.isArray(dependencies) ? dependencies : [dependencies]) : [],
//     inheritances: inheritances ? [...inheritances] : [],
//     data: <D>{ ...(data ? data() : {}) },
//     props: <P>{},
//     html: [html],
//     css: css && css.length > 0 ? [...css] : [],
//     inheritedSet: new Set(),
//     slot: slot ? [slot] : [],
//     events: events && events.length > 0 ? [...events] : []
//   }

//   if (!getWely())
//     customElements.define(
//       welyName,
//       class extends HTMLElement {
//         readonly shadowRoot!: ShadowRoot
//         readonly welyId: string = ''

//         constructor() {
//           super()
//           this.shadowRoot = this.attachShadow({ mode: 'open' })
//           this.welyId = `wely-id${generator.next().value}`

//           if (className)
//             this.setAttribute(
//               'class',
//               className
//                 .split(' ')
//                 .reduce((prev, current) => `${prev} ${current}`, toKebabCase(name))
//             )
//           else this.classList.add(toKebabCase(name))
//         }

//         static overwrite(data: () => Partial<D>) {
//           args.data = <D>{ ...args.data, ...data() }
//           return getWely()
//         }
//       }
//     )

//   return getWely()
// }

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

export const mount = (parent: string, child: HTMLElement) =>
  document.getElementById(parent)?.appendChild(child)
