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
  const getWely = () => <Wely<D>>customElements.get(welyName)

  const args: DefineArgs<T, D, P> = {
    dependencies: dependencies ? (Array.isArray(dependencies) ? dependencies : [dependencies]) : [],
    inheritances: inheritances ? [...inheritances] : [],
    data: <D>{ ...(data ? data() : {}) },
    props: <P>{},
    html: [html],
    css: css && css.length > 0 ? [...css] : [],
    inheritedSet: new Set(),
    slot: slot ? [slot] : [],
    events: events && events.length > 0 ? [...events] : []
  }

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
      }
    )

  return getWely()
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
