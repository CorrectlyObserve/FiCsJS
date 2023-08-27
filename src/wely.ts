import { Css, Define, Events, Html2, Inheritances, Slot } from '@/libs/types'

const toKebabCase = (str: string): string => {
  const newStr = str.slice(1)
  let body = newStr
  const upperCase = new RegExp(/[A-Z]/g)

  if (upperCase.test(newStr)) body = newStr.replace(upperCase, val => `-${val.toLowerCase()}`)

  return str[0].toLowerCase() + body
}

const generate = function* (): Generator<number> {
  let n = 1

  while (true) {
    yield n
    n++
  }
}

const generator: Generator<number> = generate()

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
            #inheritedSet: Set<CustomElementConstructor> = new Set()
            #props: P = <P>{}

            constructor() {
              super()
              this.shadowRoot = this.attachShadow({ mode: 'open' })

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

export const mountWely = (parent: HTMLElement | string, child: HTMLElement) =>
  (typeof parent === 'string' ? document.getElementById(parent) : parent)?.appendChild(child)
