import generator from './generator'
import {
  Css,
  Each,
  EachIf,
  Events,
  Html,
  If,
  Inheritances,
  PropsChain,
  SingleOrArray,
  Slot,
  
} from './types'

export class Class<T, D, P> {
  readonly #Id: string = ''
  readonly #name: string = ''
  readonly #class: string = ''
  readonly #inheritances: Inheritances<T, D, P> = []
  readonly #data: D = <D>{}
  readonly #html: Html<T, D, P>[] = []
  readonly #css: Css<D, P> = []
  readonly #slot: Slot<T, D, P>[] = []
  readonly #events: Events<D, P> = []

  #propsChain: PropsChain<P> = <PropsChain<P>>{ components: new Set(), chain: {} }
  #props: P = <P>{}
  #isEach: boolean = false
  #component: HTMLElement | undefined = undefined

  constructor({
    Id,
    name,
    className,
    inheritances,
    data,
    html,
    css,
    slot,
    events
  }: <T, D, P>) {
    this.#Id = Id ?? `-id${generator.next().value}`
    this.#name = name

    if (className) this.#class = className

    if (inheritances && inheritances.length > 0) this.#inheritances = [...inheritances]

    if (data) this.#data = { ...data() }

    this.#html.push(html)

    if (css && css.length > 0) this.#css = [...css]

    if (slot) this.#slot.push(slot)

    if (events && events.length > 0) this.#events = [...events]
  }

  #toArray(val: unknown | unknown[]) {
    return Array.isArray(val) ? [...val] : [val]
  }

  #toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  #define(): void {
    const name = `w-${this.#toKebabCase(this.#name)}`

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

  #clone(): Class<T, D, P> {
    return new Class<T, D, P>({
      Id: this.#Id,
      name: this.#name,
      className: this.#class,
      inheritances: this.#inheritances,
      data: () => <D>{ ...this.#data },
      html: this.#html[0],
      css: this.#css,
      slot: this.#slot.length > 0 ? this.#slot[0] : undefined,
      events: this.#events
    })
  }

  #setClass(: HTMLElement): void {
    const name = this.#toKebabCase(this.#name)

    if (this.#class === '') .classList.add(name)
    else
      .setAttribute(
        'class',
        this.#class.split(' ').reduce((prev, current) => `${prev} ${current}`, name)
      )
  }

  #toCamelCase(str: string): string {
    return str.replace(/-+(.)?/g, (_, targets) => (targets ? targets.toUpperCase() : ''))
  }

  #setPropsChain(
    propsChain: PropsChain<P> = <PropsChain<P>>{ components: new Set(), chain: {} }
  ): void {
    if (this.#inheritances.length > 0)
      for (const inheritance of this.#inheritances) {
        const { descendants, props } = inheritance

        for (const descendant of this.#toArray(descendants)) {
          const Id = descendant.#Id

          if (propsChain.components.has(Id)) {
            const checkPrototype = (chain: Record<string, P | any>): void => {
              const current = chain[this.#toCamelCase(Id)]!

              if (Object.keys(current).includes('__proto__')) checkPrototype(current.__proto__)
              else chain[this.#toCamelCase(Id)].__proto__ = { ...props(this.#data) }
            }

            checkPrototype(propsChain.chain)
          } else {
            propsChain.components.add(Id)
            propsChain.chain[this.#toCamelCase(Id)] = { ...props(this.#data) }
          }
        }
      }

    this.#propsChain = propsChain
  }

  #setProps(propsChain: PropsChain<P>) {
    if (propsChain.components.has(this.#Id)) {
      console.log(propsChain.chain[this.#toCamelCase(this.#Id)])
      this.#props = propsChain.chain[this.#toCamelCase(this.#Id)]
    }
  }

  #insert(
    arg: SingleOrArray<Class<T, D, P> | string>,
    : HTMLElement | ShadowRoot,
    propsChain: PropsChain<P>
  ): void {
    for (const val of this.#toArray(arg))
      .appendChild(
        val instanceof Class
          ? val.render(propsChain)
          : document.createRange().createContextualFragment(val)
      )
  }

  #setHtml(shadowRoot: ShadowRoot, propsChain: PropsChain<P>): void {
    const html: Html<T, D, P> =
      typeof this.#html[0] === 'function'
        ? this.#html[0]({ data: { ...this.#data }, props: { ...this.#props } })
        : this.#html[0]

    if (typeof html === 'string' || html instanceof Class || Array.isArray(html))
      this.#insert(html, shadowRoot, propsChain)
    else if ('contents' in <Each<T, D, P> | EachIf<T, D, P>>html) {
      this.#isEach = true

      if ('branches' in <EachIf<T, D, P>>html) {
        const { contents, branches, fallback } = <EachIf<T, D, P>>html

        contents.forEach((content, index) => {
          for (const branch of branches)
            if (branch.judge(content))
              this.#insert(branch.render(content, index), shadowRoot, propsChain)

          if (fallback) this.#insert(fallback(content, index), shadowRoot, propsChain)
        })
      } else {
        const { contents, render } = <Each<T, D, P>>html

        contents.forEach((content, index) => {
          const renderer = render(content, index)
          if (renderer) this.#insert(renderer, shadowRoot, propsChain)
        })
      }
    } else {
      const { branches, fallback } = <If<T, D, P>>html
      let isInserted = false

      for (const branch of branches)
        if (branch.judge) {
          this.#insert(branch.render, shadowRoot, propsChain)
          isInserted = true
        }

      if (!isInserted && fallback) this.#insert(fallback, shadowRoot, propsChain)
    }
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
              .map(([key, value]) => `${this.#toKebabCase(key)}: ${value};`)
              .join('\n')}}`
      })

      shadowRoot.appendChild(style)
    }
  }

  #setSlot(: HTMLElement, propsChain: PropsChain<P>) {
    if (this.#slot.length > 0)
      for (const slot of this.#toArray(this.#slot))
        this.#insert(
          typeof slot === 'function'
            ? slot({ data: { ...this.#data }, props: { ...this.#props } })
            : slot,
          ,
          propsChain
        )
  }

  #setEvents(: HTMLElement): void {
    if (this.#events.length > 0)
      for (const event of this.#events) {
        const { selector, handler, method } = event

        if (selector) {
          const elements: Element[] = (() => {
            const getSelectors = (selector: string) =>
              Array.from((<ShadowRoot>.shadowRoot).querySelectorAll(`:host ${selector}`))

            if (/^.+(\.|#).+$/.test(selector)) {
              const symbol = selector.includes('.') ? '.' : '#'
              const [tag, attr] = selector.split(symbol)

              return getSelectors(tag).filter(
                element => element.getAttribute(symbol === '.' ? 'class' : 'id') === attr
              )
            }

            return getSelectors(selector)
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
      Id: undefined,
      name: this.#name,
      className: this.#class,
      inheritances: this.#inheritances,
      data: () => <D>{ ...this.#data, ...partialData() },
      html: this.#html[0],
      css: this.#css,
      slot: this.#slot.length > 0 ? this.#slot[0] : undefined,
      events: this.#events
    })
  }

  render(propsChain?: PropsChain<P>): HTMLElement {
    this.#define()
    const that = this.#clone()
    const  = that.#component || document.createElement(`w-${this.#toKebabCase(this.#name)}`)

    that.#setClass()
    that.#setPropsChain(propsChain)
    that.#setProps(that.#propsChain)
    that.#setHtml(<ShadowRoot>.shadowRoot, that.#propsChain)
    that.#setCss(<ShadowRoot>.shadowRoot)
    that.#setSlot(, that.#propsChain)
    that.#setEvents()

    return 
  }

  mount(base: HTMLElement): void {
    base.appendChild(this.render())
  }
}
