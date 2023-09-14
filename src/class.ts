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
  Wely
} from './types'

export class WelyClass<T, D, P> {
  readonly #welyId: string = ''
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
    welyId,
    name,
    className,
    inheritances,
    data,
    html,
    css,
    slot,
    events
  }: Wely<T, D, P>) {
    this.#welyId = welyId ?? `wely-id${generator.next().value}`
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
    if (!customElements.get(`w-${this.#toKebabCase(this.#name)}`))
      customElements.define(
        `w-${this.#toKebabCase(this.#name)}`,
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }
        }
      )
  }

  #clone(): WelyClass<T, D, P> {
    return new WelyClass<T, D, P>({
      welyId: this.#welyId,
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

  #setClass(wely: HTMLElement): void {
    if (this.#class === '') wely.classList.add(this.#toKebabCase(this.#name))
    else
      wely.setAttribute(
        'class',
        this.#class
          .split(' ')
          .reduce((prev, current) => `${prev} ${current}`, this.#toKebabCase(this.#name))
      )
  }

  #toCamelCase(str: string): string {
    return str.replace(/-+(.)?/g, (_, targets) => (targets ? targets.toUpperCase() : ''))
  }

  #setProps(propsChain: PropsChain<P> = <PropsChain<P>>{ components: new Set(), chain: {} }): void {
    if (this.#inheritances.length > 0)
      for (const inheritance of this.#inheritances) {
        const { descendants, props } = inheritance

        for (const descendant of this.#toArray(descendants)) {
          const welyId = descendant.#welyId

          if (propsChain.components.has(welyId)) {
            const checkPrototype = (chain: Record<string, P | any>): void => {
              const current = chain[this.#toCamelCase(welyId)]!

              if (Object.keys(current).includes('__proto__')) checkPrototype(current.__proto__)
              else chain[this.#toCamelCase(welyId)].__proto__ = { ...props(this.#data) }
            }

            checkPrototype(propsChain.chain)
          } else {
            propsChain.components.add(welyId)
            propsChain.chain[this.#toCamelCase(welyId)] = { ...props(this.#data) }
          }
        }
      }

    this.#propsChain = propsChain

    if (this.#propsChain.components.has(this.#welyId))
      for (const key in propsChain.chain[this.#toCamelCase(this.#welyId)])
        this.#props[key] = propsChain.chain[this.#toCamelCase(this.#welyId)][key]
  }

  #insert(
    arg: SingleOrArray<WelyClass<T, D, P> | string>,
    wely: HTMLElement | ShadowRoot,
    propsChain: PropsChain<P>
  ): void {
    for (const element of this.#toArray(arg))
      wely.appendChild(
        element instanceof WelyClass
          ? element.render(propsChain)
          : document.createRange().createContextualFragment(element)
      )
  }

  #setHtml(shadowRoot: ShadowRoot, propsChain: PropsChain<P>): void {
    const html: Html<T, D, P> =
      typeof this.#html[0] === 'function'
        ? this.#html[0]({ data: { ...this.#data }, props: { ...this.#props } })
        : this.#html[0]

    if (typeof html === 'string' || html instanceof WelyClass || Array.isArray(html))
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

  #setSlot(wely: HTMLElement, propsChain: PropsChain<P>) {
    if (this.#slot.length > 0)
      for (const slot of this.#toArray(this.#slot))
        this.#insert(
          typeof slot === 'function'
            ? slot({ data: { ...this.#data }, props: { ...this.#props } })
            : slot,
          wely,
          propsChain
        )
  }

  #setEvents(wely: HTMLElement): void {
    if (this.#events.length > 0)
      for (const event of this.#events) {
        const { selector, handler, method } = event

        if (selector) {
          const elements: Element[] = (() => {
            const getSelectors = (selector: string) =>
              Array.from((<ShadowRoot>wely.shadowRoot).querySelectorAll(`:host ${selector}`))

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
          wely.addEventListener(handler, (event: Event) =>
            method({ data: { ...this.#data }, props: { ...this.#props } }, event)
          )
      }
  }

  overwrite(partialData: () => Partial<D>): WelyClass<T, D, P> {
    return new WelyClass<T, D, P>({
      welyId: undefined,
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
    const wely = that.#component || document.createElement(`w-${this.#toKebabCase(this.#name)}`)

    that.#setClass(wely)
    that.#setProps(propsChain)
    that.#setHtml(<ShadowRoot>wely.shadowRoot, that.#propsChain)
    that.#setCss(<ShadowRoot>wely.shadowRoot)
    that.#setSlot(wely, that.#propsChain)
    that.#setEvents(wely)

    return wely
  }

  mount(base: HTMLElement): void {
    base.appendChild(this.render())
  }
}
