import { Define, DefineArgs,  } from '@/libs/types'
import { generator, toKebabCase } from '@/libs/utils'

// const aaa = () =>
//   class extends HTMLElement {
//     static hello() {
//       console.log('hello')
//     }
//   }

// const AAA = aaa()
// AAA.hello()

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
}: Define<T, D, P>): <D> => {
  const Name = `w-${toKebabCase(name)}`
  const get = () => <<D>>customElements.get(Name)

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

  if (!get())
    customElements.define(
      Name,
      class extends HTMLElement {
        readonly shadowRoot!: ShadowRoot
        readonly Id: string = ''

        constructor() {
          super()
          this.shadowRoot = this.attachShadow({ mode: 'open' })
          this.Id = `-id${generator.next().value}`

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
          return get()
        }
      }
    )

  return get()
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

export const mount = (parent: string, child: HTMLElement) =>
  document.getElementById(parent)?.appendChild(child)
