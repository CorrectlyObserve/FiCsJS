import { Css, Each, EachIf, Events, Html, If, Inheritances, Slot,  } from '@/libs/types'
// import { convertHtml } from '@/utils'

export const  = <T, D, P>({
  name,
  className,
  dependencies,
  inheritances,
  data,
  html,
  css,
  slot,
  events
}: <T, D, P>) =>
  new Class({
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

export class Class<T, D, P> {
  readonly #name: string = ''
  readonly #class: string = ''
  readonly #dependencies: Class<T, D, P>[] = []
  readonly #inheritances: Inheritances<D, P> = []
  readonly #data: D = <D>{}
  readonly #html: Html<string | Each<T> | EachIf<T> | If, D, P>[] = []
  readonly #css: Css<D, P> = []
  readonly #slot: Slot<D, P>[] = []
  readonly #events: Events<D, P> = []

  #inheritedSet: Set<Class<T, D, P>> = new Set()
  #props: P = <P>{}
  #isEach: boolean = false

  constructor({
    name,
    className,
    dependencies,
    inheritances,
    data,
    html,
    css,
    slot,
    events
  }: <T, D, P>) {
    this.#name = name

    if (className) this.#class = className

    if (dependencies)
      this.#dependencies = Array.isArray(dependencies) ? [...dependencies] : [dependencies]

    if (inheritances && inheritances.length > 0) this.#inheritances = [...inheritances]

    if (data) this.#data = { ...data() }

    this.#html = [html]

    if (css && css.length > 0) this.#css = [...css]
    if (slot) this.#slot = [slot]
    if (events && events.length > 0) this.#events = [...events]
  }

  #generate(): Generator<number> {
    const generate = function* (): Generator<number> {
      let n = 1

      while (true) {
        yield n
        n++
      }
    }

    return generate()
  }

  #convertToKebabCase(str: string): string {
    const upperCase = new RegExp(/[A-Z]/g)
    const body = str.slice(1)

    return (
      str.slice(0, 1).toLowerCase() +
      (upperCase.test(body) ? body.replace(upperCase, val => `-${val.toLowerCase()}`) : body)
    )
  }

  #convertName(): string {
    return `w-${this.#convertToKebabCase(this.#name)}`
  }

  #define(): void {
    const name = this.#convertName()

    if (!customElements.get(name))
      customElements.define(
        name,
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }
        }
      )
  }

  #setClassName(: HTMLElement): void {
    if (this.#class !== '')
      .setAttribute(
        'class',
        this.#class.split(' ').reduce((prev, current) => `${prev} ${current}`, this.#name)
      )
    else .classList.add(this.#name)
  }

  #setCss(shadowRoot: ShadowRoot): void {
    if (this.#css.length > 0) {
      const style = document.createElement('style')

      this.#css.forEach(cssObj => {
        if (typeof cssObj === 'string') style.textContent += cssObj
        else if (cssObj.selector && 'style' in cssObj)
          style.textContent +=
            cssObj.selector +
            `{${Object.entries(cssObj.style({ data: { ...this.#data }, props: { ...this.#props } }))
              .map(([key, value]) => `${this.#convertToKebabCase(key)}: ${value};`)
              .join('\n')}}`
      })

      shadowRoot.appendChild(style)
    }
  }

  #setEventHandlers(: HTMLElement): void {
    if (this.#events.length > 0)
      for (const event of this.#events) {
        const { selector, handler, method } = event

        if (selector) {
          const elements: Element[] = (() => {
            const createArr = (selector: string) =>
              Array.from((<ShadowRoot>.shadowRoot).querySelectorAll(`:host ${selector}`))

            if (/^.+(\.|#).+$/.test(selector)) {
              const symbol = selector.includes('.') ? '.' : '#'
              const [tag, attr] = selector.split(symbol)

              return createArr(tag).filter(
                element => element.getAttribute(symbol === '.' ? 'class' : 'id') === attr
              )
            }

            return createArr(selector)
          })()

          if (elements.length === 0)
            throw Error(`The element does not exist or is not applicable...`)
          else
            for (let i = 0; i < elements.length; i++)
              elements[i].addEventListener(handler, (e: Event) =>
                method(
                  { data: { ...this.#data }, props: { ...this.#props } },
                  e,
                  this.#isEach ? i : undefined
                )
              )
        } else
          .addEventListener(handler, (event: Event) =>
            method({ data: { ...this.#data }, props: { ...this.#props } }, event)
          )
      }
  }

  overwrite(partialData: () => Partial<D>): Class<T, D, P> {
    return new Class<T, D, P>({
      name: `${this.#name}${this.#generate().next().value + 1}`,
      className: this.#class,
      dependencies: this.#dependencies,
      inheritances: this.#inheritances,
      data: () => <D>{ ...this.#data, ...partialData() },
      html: this.#html[0],
      css: this.#css,
      slot: this.#slot.length > 0 ? this.#slot[0] : undefined,
      events: this.#events
    })
  }

  render(): HTMLElement {
    this.#define()
    const : HTMLElement = document.createElement(this.#convertName())
    const shadowRoot: ShadowRoot = <ShadowRoot>.shadowRoot

    this.#setClassName()

    shadowRoot.textContent = (<any>this.#data).message

    this.#setCss(<ShadowRoot>.shadowRoot)
    this.#setEventHandlers()

    return 
  }

  mount(base: HTMLElement): void {
    base.appendChild(this.render())
  }
}
