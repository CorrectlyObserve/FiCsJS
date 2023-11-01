import { Css, Events, Html, Inheritances, PropsChain,  } from './types'
import { generator, symbol } from './utils'

export class Element<D, P> {
  readonly #Id: string = ''
  readonly #name: string = ''
  readonly #class: string = ''
  readonly #data: D = <D>{}
  readonly #inheritances: Inheritances<D> = []
  readonly #isOnlyCsr: boolean = false
  readonly #html: Html<D, P>[] = []
  readonly #css: Css<D, P> = []
  readonly #ssrCss: Css<D, P> = []
  readonly #slot: Html<D, P>[] = []
  readonly #events: Events<D, P> = []

  #propsChain: PropsChain<P> = <PropsChain<P>>{ descendants: new Set(), chains: {} }
  #props: P = <P>{}
  #component: HTMLElement | undefined = undefined

  constructor({
    Id,
    name,
    className,
    data,
    props,
    isOnlyCsr,
    html,
    css,
    ssrCss,
    slot,
    events
  }: <D, P>) {
    this.#Id = Id ?? `${generator.next().value}`
    this.#name = name
    if (className && className !== '') this.#class = className

    if (data) this.#data = { ...data() }
    if (props && props.length > 0) this.#inheritances = [...props]

    if (isOnlyCsr) this.#isOnlyCsr = true
    this.#html.push(html)

    if (css && css.length > 0) this.#css = [...css]
    if (ssrCss && ssrCss.length > 0) this.#ssrCss = [...ssrCss]

    if (slot) this.#slot.push(slot)
    if (events && events.length > 0) this.#events = [...events]
  }

  #clone(
    { Id, data }: { Id?: string; data?: () => D } = {
      Id: this.#Id,
      data: () => <D>{ ...this.#data }
    }
  ): Element<D, P> {
    return new Element<D, P>({
      Id,
      name: this.#name,
      className: this.#class,
      data,
      props: this.#inheritances,
      isOnlyCsr: this.#isOnlyCsr,
      html: this.#html[0],
      css: this.#css,
      ssrCss: this.#ssrCss,
      slot: this.#slot.length > 0 ? this.#slot[0] : undefined,
      events: this.#events
    })
  }

  #toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  #getTagName(): string {
    return `w-${this.#toKebabCase(this.#name)}`
  }

  #addClass(?: HTMLElement): string | void {
    const name = this.#toKebabCase(this.#name)
    const className = this.#class.split(' ').reduce((prev, curr) => prev + ' ' + curr, name)

    if (!) return this.#class === '' ? name : className

    this.#class === '' ? .classList.add(name) : .setAttribute('class', className)
  }

  #setProps(
    propsChain: PropsChain<P> = <PropsChain<P>>{ descendants: new Set(), chains: {} }
  ): void {
    if (this.#inheritances.length > 0)
      for (const inheritance of this.#inheritances) {
        const { descendants, props } = inheritance

        for (const descendant of Array.isArray(descendants) ? descendants : [descendants])
          if (propsChain.descendants.has(descendant.#Id)) {
            const setPropsChain = (chain: Record<string, any>): void => {
              const localChain = chain[descendant.#Id]

              if (localChain.isPrototypeOf()) setPropsChain(Object.getPrototypeOf(localChain))
              else localChain.__proto__ = { ...props(this.#data) }
            }

            setPropsChain(propsChain.chains)
          } else {
            propsChain.descendants.add(descendant.#Id)
            propsChain.chains[descendant.#Id] = { ...props(this.#data) }
          }
      }

    this.#propsChain = propsChain

    if (this.#propsChain.descendants.has(this.#Id))
      for (const key in this.#propsChain.chains[this.#Id])
        this.#props[key] = this.#propsChain.chains[this.#Id][key]
  }

  #convertHtml(html: Html<D, P>): Record<symbol, (Element<D, P> | string)[]> {
    return typeof html === 'function'
      ? html({ data: { ...this.#data }, props: { ...this.#props } })
      : html
  }

  #appendChild(
    elements: (Element<D, P> | string)[],
    : HTMLElement | ShadowRoot,
    propsChain: PropsChain<P>
  ): void {
    for (const element of elements)
      .appendChild(
        element instanceof Element
          ? element.#render(propsChain)
          : document.createRange().createContextualFragment(element)
      )
  }

  #addHtml(shadowRoot?: ShadowRoot): string | void {
    const html = this.#convertHtml(this.#html[0])

    if (html.hasOwnProperty(symbol)) {
      if (!shadowRoot)
        return <string>(
          html[symbol].reduce(
            (prev, curr) =>
              prev + (curr instanceof Element ? curr.#renderOnServer(this.#propsChain) : curr),
            ''
          )
        )

      this.#appendChild(html[symbol], shadowRoot, this.#propsChain)
    } else
      throw Error(
        `${this.#name} has to use html function (tagged template literal) in html argument.`
      )
  }

  #addCss(shadowRoot?: ShadowRoot): string | void {
    const css = shadowRoot ? [...this.#css] : [...this.#css, ...this.#ssrCss]

    if (css.length > 0) {
      const style = css.reduce((prev, curr) => {
        if (typeof curr !== 'string' && curr.selector && 'style' in curr) {
          const styleContent = Object.entries(
            typeof curr.style === 'function'
              ? curr.style({ data: { ...this.#data }, props: { ...this.#props } })
              : curr.style
          )
            .map(([key, value]) => `${this.#toKebabCase(key)}: ${value};`)
            .join('\n')

          return `${prev}${curr.selector}{${styleContent}}`
        }

        return `${prev}${curr}`
      }, '')

      if (!shadowRoot) return `<style>${style}</style>`

      const stylesheet = new CSSStyleSheet()
      shadowRoot.adoptedStyleSheets = [stylesheet]
      stylesheet.replace(<string>style)
    }
  }

  #addSlot(: HTMLElement): void {
    if (this.#slot.length > 0)
      for (const slot of this.#slot)
        this.#appendChild(this.#convertHtml(slot)[symbol], , this.#propsChain)
  }

  #addEvents(: HTMLElement): void {
    if (this.#events.length > 0)
      for (const event of this.#events) {
        const { selector, handler, method } = event

        const elements = selector
          ? (() => {
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
          : []

        if (elements.length > 0)
          for (const element of elements)
            element.addEventListener(handler, (event: Event) =>
              method({ data: { ...this.#data }, props: { ...this.#props } }, event)
            )
        else console.error(`:host ${selector} does not exist or is not applicable...`)
      }
  }

  #createComponent(: HTMLElement, propsChain?: PropsChain<P>): void {
    this.#addClass()
    this.#setProps(propsChain)
    this.#addHtml(<ShadowRoot>.shadowRoot)
    this.#addCss(<ShadowRoot>.shadowRoot)
    this.#addSlot()
    this.#addEvents()
  }

  #render(propsChain?: PropsChain<P>): HTMLElement {
    const that = this.#clone()
    const name = that.#getTagName()

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

    const  = that.#component ?? document.createElement(name)

    that.#createComponent(, propsChain)

    if (!that.#component) that.#component = 

    return 
  }

  #renderOnServer(propsChain?: PropsChain<P>): string {
    const that = this.#clone()
    const name = that.#getTagName()

    if (that.#isOnlyCsr) return `<${name}></${name}>`

    that.#setProps(propsChain)

    if (that.#slot.length > 0)
      console.warn(`${that.#name} has slot property, but it cannot be used in ssr...`)

    return `
        <${name} class="${that.#addClass()}">
          <template shadowroot="open">
            <slot></slot>${that.#addCss() ?? ''}
          </template>
          ${that.#addHtml()}
        </${name}>
      `.trim()
  }

  overwrite(partialData: () => Partial<D>): Element<D, P> {
    return this.#clone({ Id: undefined, data: () => <D>{ ...this.#data, ...partialData() } })
  }

  define(): void {
    const that = this.#clone()
    const name = that.#getTagName()

    if (!customElements.get(name))
      customElements.define(
        name,
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot
          #isRendered: boolean = false

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }

          connectedCallback(): void {
            if (!this.#isRendered) {
              that.#createComponent(this)
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
