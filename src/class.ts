import {
  Css,
  Each,
  EachIf,
  EventHandler,
  Html,
  HtmlOrSlot,
  HtmlSymbol,
  If,
  Inheritances,
  PropsChain,
  SanitizedHtml,
  Slot,
  Wely
} from './types'
import { generator, symbol } from './utils'

export class WelyElement<T, D, P> {
  readonly #welyId: string = ''
  readonly #name: string = ''
  readonly #class: string = ''
  readonly #inheritances: Inheritances<T, D> = []
  readonly #data: D = <D>{}
  readonly #isOnlyCsr: boolean = false
  readonly #html: Html<T, D, P>[] = []
  readonly #css: Css<D, P> = []
  readonly #ssrCss: Css<D, P> = []
  readonly #slot: Slot<T, D, P>[] = []
  readonly #events: EventHandler<D, P>[] = []

  #propsChain: PropsChain<P> = <PropsChain<P>>{ descendants: new Set(), chains: {} }
  #props: P = <P>{}
  #isEach: boolean = false
  #component: HTMLElement | undefined = undefined

  constructor({
    welyId,
    name,
    className,
    inheritances,
    data,
    isOnlyCsr,
    html,
    css,
    ssrCss,
    csrSlot,
    events
  }: Wely<T, D, P>) {
    this.#welyId = welyId ?? `wely-id${generator.next().value}`
    this.#name = name

    if (className && className !== '') this.#class = className
    if (inheritances && inheritances.length > 0) this.#inheritances = [...inheritances]
    if (data) this.#data = { ...data() }
    if (isOnlyCsr) this.#isOnlyCsr = true

    this.#html.push(html)

    if (css && css.length > 0) this.#css = [...css]
    if (ssrCss && ssrCss.length > 0) this.#ssrCss = [...ssrCss]
    if (csrSlot) this.#slot.push(csrSlot)
    if (events && events.length > 0) this.#events = [...events]
  }

  #clone(
    { welyId, data }: { welyId?: string; data?: () => D } = {
      welyId: this.#welyId,
      data: () => <D>{ ...this.#data }
    }
  ): WelyElement<T, D, P> {
    return new WelyElement<T, D, P>({
      welyId,
      name: this.#name,
      className: this.#class,
      inheritances: this.#inheritances,
      data,
      isOnlyCsr: this.#isOnlyCsr,
      html: this.#html[0],
      css: this.#css,
      ssrCss: this.#ssrCss,
      csrSlot: this.#slot.length > 0 ? this.#slot[0] : undefined,
      events: this.#events
    })
  }

  #convertCase(str: string, type: 'camel' | 'kebab'): string {
    if (type === 'camel')
      return str.replace(/-+(.)?/g, (_, targets) => (targets ? targets.toUpperCase() : ''))

    if (type === 'kebab') return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

    return str
  }

  #getKebabName() {
    return this.#convertCase(this.#name, 'kebab')
  }

  #getTagName() {
    return `w-${this.#getKebabName()}`
  }

  #getClass(): string {
    return this.#class.split(' ').reduce((prev, curr) => prev + ' ' + curr, this.#getKebabName())
  }

  #addClass(wely: HTMLElement): void {
    this.#class === ''
      ? wely.classList.add(this.#getKebabName())
      : wely.setAttribute('class', this.#getClass())
  }

  #toArray(val: unknown | unknown[]) {
    return Array.isArray(val) ? [...val] : [val]
  }

  #setProps(
    propsChain: PropsChain<P> = <PropsChain<P>>{ descendants: new Set(), chains: {} }
  ): void {
    if (this.#inheritances.length > 0)
      for (const inheritance of this.#inheritances) {
        const { descendants, props } = inheritance

        for (const descendant of this.#toArray(descendants)) {
          const welyId = descendant.#welyId

          if (propsChain.descendants.has(welyId)) {
            const setPropsChain = (chain: Record<string, any>): void => {
              const localChain = chain[this.#convertCase(welyId, 'camel')]!

              if (localChain.isPrototypeOf()) setPropsChain(Object.getPrototypeOf(localChain))
              else localChain.__proto__ = { ...props(this.#data) }
            }

            setPropsChain(propsChain.chains)
          } else {
            propsChain.descendants.add(welyId)
            propsChain.chains[this.#convertCase(welyId, 'camel')] = { ...props(this.#data) }
          }
        }
      }

    this.#propsChain = propsChain

    if (this.#propsChain.descendants.has(this.#welyId))
      for (const key in this.#propsChain.chains[this.#convertCase(this.#welyId, 'camel')])
        this.#props[key] = this.#propsChain.chains[this.#convertCase(this.#welyId, 'camel')][key]
  }

  #convertHtml(html: Html<T, D, P> | Slot<T, D, P>): HtmlSymbol<T, D, P> | HtmlOrSlot<T, D, P> {
    return typeof html === 'function'
      ? html({ data: { ...this.#data }, props: { ...this.#props } })
      : html
  }

  #appendChild(
    arg: SanitizedHtml<T, D, P> | WelyElement<T, D, P> | string,
    wely: HTMLElement | ShadowRoot,
    propsChain: PropsChain<P>
  ): void {
    for (const element of this.#toArray(arg))
      wely.appendChild(
        element instanceof WelyElement
          ? element.#render(propsChain)
          : document.createRange().createContextualFragment(element)
      )
  }

  #addHtml(shadowRoot: ShadowRoot, propsChain: PropsChain<P>): void {
    const html: Html<T, D, P> = this.#convertHtml(this.#html[0])

    if (html.hasOwnProperty(symbol))
      this.#appendChild((<HtmlSymbol<T, D, P>>html)[symbol], shadowRoot, propsChain)
    else if ('contents' in <Each<T> | EachIf<T>>html) {
      this.#isEach = true

      if ('branches' in <EachIf<T>>html) {
        const { contents, branches, fallback } = <EachIf<T>>html

        contents.forEach((content, index) => {
          for (const branch of branches)
            if (branch.judge(content))
              this.#appendChild(branch.render(content, index), shadowRoot, propsChain)

          if (fallback) this.#appendChild(fallback(content, index), shadowRoot, propsChain)
        })
      } else {
        const { contents, render } = <Each<T>>html

        contents.forEach((content, index) => {
          const renderer = render(content, index)
          if (renderer) this.#appendChild(renderer, shadowRoot, propsChain)
        })
      }
    } else if ('contents' in <If<T>>html) {
      const { branches, fallback } = <If<T>>html
      let isInserted = false

      for (const branch of branches)
        if (branch.judge) {
          this.#appendChild(branch.render, shadowRoot, propsChain)
          isInserted = true
        }

      if (!isInserted && fallback) this.#appendChild(fallback, shadowRoot, propsChain)
    } else
      throw Error(
        `${this.#name} has to use html function (tagged template literal) in html argument.`
      )
  }

  #addCss(css: Css<D, P>, shadowRoot?: ShadowRoot): string | void {
    if (css.length > 0) {
      const styleContent = <string>css.reduce((prev, curr) => {
        if (typeof curr === 'string') return prev + curr

        if (curr.selector && 'style' in curr)
          return `${prev}${curr.selector}{${Object.entries(
            curr.style({ data: { ...this.#data }, props: { ...this.#props } })
          )
            .map(([key, value]) => `${this.#convertCase(key, 'kebab')}: ${value};`)
            .join('\n')}}`

        return ''
      }, '')

      if (!shadowRoot) return styleContent

      const stylesheet = new CSSStyleSheet()
      shadowRoot.adoptedStyleSheets = [stylesheet]
      stylesheet.replace(styleContent)
    }
  }

  #addSlot(wely: HTMLElement, propsChain: PropsChain<P>): void {
    if (this.#slot.length > 0)
      for (const slot of this.#toArray(this.#slot))
        this.#appendChild(
          (<HtmlSymbol<T, D, P>>this.#convertHtml(<Slot<T, D, P>>slot))[symbol],
          wely,
          propsChain
        )
  }

  #addEvents(wely: HTMLElement): void {
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
            console.error(`The element does not exist or is not applicable...`)
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

  #render(propsChain?: PropsChain<P>): HTMLElement {
    const that = this.#clone()

    if (!customElements.get(that.#getTagName()))
      customElements.define(
        that.#getTagName(),
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }
        }
      )

    const wely = that.#component || document.createElement(that.#getTagName())

    that.#addClass(wely)
    that.#setProps(propsChain)
    that.#addHtml(<ShadowRoot>wely.shadowRoot, that.#propsChain)
    that.#addCss(this.#css, <ShadowRoot>wely.shadowRoot)
    that.#addSlot(wely, that.#propsChain)
    that.#addEvents(wely)

    if (!that.#component) that.#component = wely

    return wely
  }

  #renderOnServer(propsChain?: PropsChain<P>): string {
    const that = this.#clone()

    if (that.#isOnlyCsr) return `<${that.#getTagName()}></${that.#getTagName()}>`

    that.#setProps(propsChain)

    const insertTemplate = (
      arg: SanitizedHtml<T, D, P> | WelyElement<T, D, P> | string,
      propsChain: PropsChain<P>
    ): string =>
      this.#toArray(arg).reduce(
        (prev, curr) =>
          prev + curr instanceof WelyElement ? curr.#renderOnServer(propsChain) : curr,
        ''
      )

    const addHtml = (instance: WelyElement<T, D, P>) => {
      const html: Html<T, D, P> = instance.#convertHtml(instance.#html[0])

      if (html.hasOwnProperty(symbol))
        return insertTemplate((<HtmlSymbol<T, D, P>>html)[symbol], instance.#propsChain)

      if ('contents' in <Each<T> | EachIf<T>>html) {
        instance.#isEach = true

        if ('branches' in <EachIf<T>>html) {
          const { contents, branches, fallback } = <EachIf<T>>html

          contents.forEach((content, index) => {
            for (const branch of branches)
              if (branch.judge(content))
                return insertTemplate(branch.render(content, index), instance.#propsChain)

            if (fallback) return insertTemplate(fallback(content, index), instance.#propsChain)

            return
          })

          return
        }

        const { contents, render } = <Each<T>>html

        contents.forEach((content, index) => {
          const renderer = render(content, index)
          if (renderer) return insertTemplate(renderer, instance.#propsChain)

          return
        })
      }

      if ('contents' in <If<T>>html) {
        const { branches, fallback } = <If<T>>html

        for (const branch of branches)
          if (branch.judge) return insertTemplate(branch.render, instance.#propsChain)

        if (fallback) return insertTemplate(fallback, instance.#propsChain)

        return
      }

      throw Error(
        `${this.#name} has to use html function (tagged template literal) in html argument.`
      )
    }

    const className = that.#class === '' ? that.#getKebabName() : that.#getClass()
    const style =
      that.#css.length > 0 || that.#ssrCss.length > 0
        ? `<style>${that.#addCss([...that.#css, ...that.#ssrCss])}</style>`
        : ''

    return `
          <${that.#getTagName()} class="${className}">
            <template shadowroot="open"><slot></slot>${style}</template>
            ${addHtml(that)}
          </${that.#getTagName()}>
        `.trim()
  }

  overwrite(partialData: () => Partial<D>): WelyElement<T, D, P> {
    return this.#clone({ welyId: undefined, data: () => <D>{ ...this.#data, ...partialData() } })
  }

  define(): void {
    const that = this.#clone()

    if (!customElements.get(that.#getTagName()))
      customElements.define(
        that.#getTagName(),
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot
          #isRendered: boolean = false

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }

          connectedCallback(): void {
            if (!this.#isRendered) {
              that.#addClass(this)
              that.#setProps()
              that.#addHtml(this.shadowRoot, that.#propsChain)
              that.#addCss(that.#css, this.shadowRoot)
              that.#addSlot(this, that.#propsChain)
              that.#addEvents(this)

              this.#isRendered = true
            }
          }
        }
      )
  }

  ssr(): string {
    return this.#renderOnServer()
  }
}
