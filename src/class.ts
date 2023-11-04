import {
  Css,
  Events,
  Html,
  NamedSlot,
  Props,
  PropsChain,
  SanitizedHtml,
  Slot,
  Variables,
  
} from './types'
import { generator, symbol } from './utils'

export class Element<D, P> {
  readonly #Id: string
  readonly #name: string
  readonly #class: string = ''
  readonly #data: D = <D>{}
  readonly #props: Props<D> = []
  readonly #isOnlyCsr: boolean = false
  readonly #html: Html<D, P>[] = []
  readonly #css: Css<D, P> = []
  readonly #ssrCss: Css<D, P> = []
  readonly #slot: Slot<D, P>[] = []
  readonly #events: Events<D, P> = []

  #propsChain: PropsChain<P> = <PropsChain<P>>{ descendants: new Set(), chains: {} }
  #inheritedProps: P = <P>{}
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
    if (props && props.length > 0) this.#props = [...props]

    if (isOnlyCsr) this.#isOnlyCsr = true
    this.#html.push(html)

    if (css && css.length > 0) this.#css = [...css]
    if (ssrCss && ssrCss.length > 0) this.#ssrCss = [...ssrCss]

    if (slot) Array.isArray(slot) ? (this.#slot = [...slot]) : this.#slot.push(slot)
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
      props: this.#props,
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
    if (this.#props.length > 0)
      for (const prop of this.#props) {
        const { descendants, values } = prop

        for (const descendant of Array.isArray(descendants) ? descendants : [descendants])
          if (propsChain.descendants.has(descendant.#Id)) {
            const setPropsChain = (chain: Record<string, any>): void => {
              const localChain = chain[descendant.#Id]

              if (localChain.isPrototypeOf()) setPropsChain(Object.getPrototypeOf(localChain))
              else localChain.__proto__ = { ...values(this.#data) }
            }

            setPropsChain(propsChain.chains)
          } else {
            propsChain.descendants.add(descendant.#Id)
            propsChain.chains[descendant.#Id] = { ...values(this.#data) }
          }
      }

    this.#propsChain = propsChain

    if (this.#propsChain.descendants.has(this.#Id))
      for (const key in this.#propsChain.chains[this.#Id])
        this.#inheritedProps[key] = this.#propsChain.chains[this.#Id][key]
  }

  #convertHtml(html: Html<D, P>): SanitizedHtml<D, P> {
    return typeof html === 'function'
      ? html({ data: { ...this.#data }, props: { ...this.#inheritedProps } })
      : html
  }

  #appendChild(
    variables: Variables<D, P>[],
    shadowRoot: ShadowRoot,
    propsChain: PropsChain<P>
  ): void {
    for (const variable of variables)
      if (variable instanceof Element)
        if (variable.#getTagName() === 'w--slot')
          if (this.#slot.length > 0) {
            const slotName = variable.#convertHtml(variable.#html[0])[symbol][0]

            if (this.#slot.every(slot => 'name' in slot && 'values' in slot)) {
              const slot = (<NamedSlot<D, P>>this.#slot).find(slot => slot.name === slotName)

              if (slot)
                this.#appendChild(this.#convertHtml(slot.values)[symbol], shadowRoot, propsChain)
              else
                throw Error(
                  `${this.#name} has no ${slotName === '' ? 'applicable' : slotName} slot...`
                )
            } else if (slotName === '')
              this.#appendChild(
                this.#convertHtml(<Html<D, P>>this.#slot[0])[symbol],
                shadowRoot,
                propsChain
              )
            else throw Error(`${this.#name} has no slot...`)
          } else throw Error(`${this.#name} has no slot...`)
        else shadowRoot.appendChild(variable.#render(propsChain))
      else shadowRoot.appendChild(document.createRange().createContextualFragment(variable))
  }

  #addHtml(shadowRoot: ShadowRoot): void {
    const html = this.#convertHtml(this.#html[0])

    if (html.hasOwnProperty(symbol)) this.#appendChild(html[symbol], shadowRoot, this.#propsChain)
    else
      throw Error(
        `${this.#name} has to use html function (tagged template literal) in html argument.`
      )
  }

  #returnHtml(html: Html<D, P>): string {
    const sanitizedHtml = this.#convertHtml(html)

    if (sanitizedHtml.hasOwnProperty(symbol)) return <string>sanitizedHtml[symbol].reduce(
        (prev, curr) => {
          if (curr instanceof Element) {
            if (curr.#getTagName() === 'w--slot')
              if (this.#slot.length > 0) {
                const slotName = curr.#convertHtml(curr.#html[0])[symbol][0]

                if (this.#slot.every(slot => 'name' in slot && 'values' in slot)) {
                  const slot = (<NamedSlot<D, P>>this.#slot).find(slot => slot.name === slotName)

                  if (slot) return this.#returnHtml(slot.values)
                  else
                    throw Error(
                      `${this.#name} has no ${slotName === '' ? 'applicable' : slotName} slot...`
                    )
                } else if (slotName === '') return this.#returnHtml(<Html<D, P>>this.#slot[0])
                else throw Error(`${this.#name} has no slot...`)
              } else throw Error(`${this.#name} has no slot...`)

            return prev + curr.#renderOnServer(this.#propsChain)
          }

          return prev + curr
        },
        ''
      )

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
              ? curr.style({ data: { ...this.#data }, props: { ...this.#inheritedProps } })
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
              method({ data: { ...this.#data }, props: { ...this.#inheritedProps } }, event)
            )
        else console.error(`:host ${selector} does not exist or is not applicable...`)
      }
  }

  #createComponent(: HTMLElement, propsChain?: PropsChain<P>): void {
    this.#addClass()
    this.#setProps(propsChain)
    this.#addHtml(<ShadowRoot>.shadowRoot)
    this.#addCss(<ShadowRoot>.shadowRoot)
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

    return `
        <${name} class="${that.#addClass()}">
          <template shadowroot="open">
            <slot></slot>${that.#addCss() ?? ''}
          </template>
          ${that.#returnHtml(that.#html[0])}
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
