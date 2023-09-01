import { Css, Each, EachIf, Events, Html, If, Inheritances, Slot, Wely } from '@/types'

export class WelyClass<T, D, P> {
  readonly #name: string = ''
  readonly #class: string = ''
  readonly #dependencies: WelyClass<T, D, P>[] = []
  readonly #inheritances: Inheritances<T, D, P> = []
  readonly #data: D = <D>{}
  readonly #html: Html<T, D, P>[] = []
  readonly #css: Css<D, P> = []
  readonly #slot: Slot<T, D, P>[] = []
  readonly #events: Events<D, P> = []

  #dependencySet: Set<WelyClass<T, D, P>> = new Set()
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
  }: Wely<T, D, P>) {
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

  #setClassName(wely: HTMLElement): void {
    if (this.#class !== '')
      wely.setAttribute(
        'class',
        this.#class.split(' ').reduce((prev, current) => `${prev} ${current}`, this.#name)
      )
    else wely.classList.add(this.#name)
  }

  #setProps(): void {
    if (this.#inheritances.length > 0) {
      const getDependencies = (dependencies: WelyClass<T, D, P>[]) => {
        if (dependencies.length > 0)
          for (const dependency of dependencies) {
            if (!this.#dependencySet.has(dependency)) this.#dependencySet.add(dependency)
            if (dependency.#dependencies) getDependencies(dependency.#dependencies)
          }
      }

      getDependencies(this.#dependencies)

      for (const inheritance of this.#inheritances) {
        const { descendants, props } = inheritance

        for (const descendant of Array.isArray(descendants) ? descendants : [descendants])
          if (this.#dependencySet.has(descendant)) descendant.#props = props(this.#data)
          else throw Error(`This component is not a descendant...`)
      }
    }
  }

  #setHtml(shadowRoot: ShadowRoot): void {
    let html: Html<T, D, P> = this.#html[0]

    if (typeof html === 'function')
      html = html({ data: { ...this.#data }, props: { ...this.#props } })

    console.log(html)
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

  #setEventHandlers(wely: HTMLElement): void {
    if (this.#events.length > 0)
      for (const event of this.#events) {
        const { selector, handler, method } = event

        if (selector) {
          const elements: Element[] = (() => {
            const createArr = (selector: string) =>
              Array.from((<ShadowRoot>wely.shadowRoot).querySelectorAll(`:host ${selector}`))

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
          wely.addEventListener(handler, (event: Event) =>
            method({ data: { ...this.#data }, props: { ...this.#props } }, event)
          )
      }
  }

  overwrite(partialData: () => Partial<D>): WelyClass<T, D, P> {
    return new WelyClass<T, D, P>({
      name: this.#name,
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
    const wely: HTMLElement = document.createElement(this.#convertName())

    this.#setClassName(wely)
    this.#setProps()
    this.#setHtml(<ShadowRoot>wely.shadowRoot)
    this.#setCss(<ShadowRoot>wely.shadowRoot)
    this.#setEventHandlers(wely)

    return wely
  }

  mount(base: HTMLElement): void {
    base.appendChild(this.render())
  }
}
