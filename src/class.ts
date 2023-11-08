import { Class, Css, Descendant, Events, Html, NamedSlot, Props, PropsChain,  } from './types'
import { generator, symbol } from './utils'

export class Element<D, P> {
  readonly #Id: string
  readonly #name: string
  readonly #data: D = <D>{}
  readonly #props: Props<D> = []
  readonly #isOnlyCsr: boolean = false
  readonly #class: Class<D, P>[] = []
  readonly #html: Html<D, P>[] = []
  readonly #css: Css<D, P> = []
  readonly #ssrCss: Css<D, P> = []
  readonly #slot: Html<D, P>[] | (Html<D, P> | NamedSlot<D, P>)[] = []
  readonly #events: Events<D, P> = []

  #propsChain: PropsChain<P> = <PropsChain<P>>{ descendants: new Set(), chains: {} }
  #inheritedProps: P = <P>{}
  #component: HTMLElement | undefined = undefined

  constructor({
    Id,
    name,
    data,
    props,
    isOnlyCsr,
    className,
    html,
    css,
    ssrCss,
    slot,
    events
  }: <D, P>) {
    this.#Id = Id ?? `${generator.next().value}`
    this.#name = name

    if (data) this.#data = { ...data() }
    if (props && props.length > 0) this.#props = [...props]

    if (isOnlyCsr) this.#isOnlyCsr = true
    if (className && className !== '') this.#class.push(className)
    this.#html.push(html)

    if (css && css.length > 0) this.#css = [...css]
    if (ssrCss && ssrCss.length > 0) this.#ssrCss = [...ssrCss]

    if (slot) this.#slot = Array.isArray(slot) ? [...slot] : [slot]
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
      data,
      props: this.#props,
      isOnlyCsr: this.#isOnlyCsr,
      className: this.#class[0],
      html: this.#html[0],
      css: this.#css,
      ssrCss: this.#ssrCss,
      slot:
        this.#slot.length > 0
          ? this.#slot.some(slot => 'name' in slot && 'values' in slot)
            ? [...this.#slot]
            : <Html<D, P>>this.#slot[0]
          : undefined,
      events: this.#events
    })
  }

  #toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  #getTagName(): string {
    return `w-${this.#toKebabCase(this.#name)}`
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

  #convert<A, R>(arg: A): R {
    return typeof arg === 'function'
      ? arg({ data: { ...this.#data }, props: { ...this.#inheritedProps } })
      : arg
  }

  #addClass(?: HTMLElement): string | void {
    const className =
      this.#toKebabCase(this.#name) +
      (this.#class.length > 0 ? ` ${this.#convert<Class<D, P>, string>(this.#class[0])}` : '')

    if (!) return className
    .setAttribute('class', className)
  }

  #convertHtml(html: Html<D, P>): (Element<D, P> | string)[] | void {
    return this.#convert<Html<D, P>, Record<symbol, (Descendant | string)[]>>(html)[symbol]
  }

  #getSlot(slotName: string): Html<D, P> | undefined {
    const slot = this.#slot.find(slot =>
      slotName !== ''
        ? 'name' in slot && 'values' in slot && slot.name === slotName
        : !('name' in slot && 'values' in slot)
    )

    if (slot) {
      if (this.#slot.some(slot => 'name' in slot && 'values' in slot))
        return 'name' in slot && 'values' in slot ? slot.values : slot

      return <Html<D, P>>this.#slot[0]
    }

    return undefined
  }

  #addHtml(shadowRoot: ShadowRoot, html: Html<D, P>): void {
    const elements = this.#convertHtml(html)

    if (elements)
      for (const element of elements) {
        if (element instanceof Element && element.#getTagName() === 'w--slot') {
          if (this.#slot.length > 0) {
            const slotName = this.#convertHtml(element.#html[0])?.[0] ?? ''
            const slot = this.#getSlot(<string>slotName)

            if (slot) this.#addHtml(shadowRoot, slot)
            else
              throw Error(`${this.#name} has no ${slotName === '' ? 'unnamed' : slotName} slot...`)
          } else throw Error(`${this.#name} has no slot contents...`)
        } else
          shadowRoot.appendChild(
            element instanceof Element
              ? element.#render(this.#propsChain)
              : document.createRange().createContextualFragment(element)
          )
      }

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
                const prefix = selector.includes('.') ? '.' : '#'
                const [tag, attr] = selector.split(prefix)

                return getSelectors(tag).filter(
                  element => element.getAttribute(prefix === '.' ? 'class' : 'id') === attr
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
    this.#setProps(propsChain)
    this.#addClass()
    this.#addHtml(<ShadowRoot>.shadowRoot, this.#html[0])
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

    const addHtml = (html: Html<D, P>): string => {
      const elements = that.#convertHtml(html)

      if (elements) return <string>elements.reduce((prev, curr) => {
          if (curr instanceof Element && curr.#getTagName() === 'w--slot') {
            if (this.#slot.length > 0) {
              const slotName = this.#convertHtml(curr.#html[0])?.[0] ?? ''
              const slot = this.#getSlot(<string>slotName)

              if (slot) return prev + addHtml(slot)

              throw Error(`${this.#name} has no ${slotName === '' ? 'unnamed' : slotName} slot...`)
            } else throw Error(`${this.#name} has no slot contents...`)
          } else
            return (
              prev + (curr instanceof Element ? curr.#renderOnServer(that.#propsChain) : curr)
            )
        }, '')

      throw Error(
        `${this.#name} has to use html function (tagged template literal) in html argument.`
      )
    }

    return `
        <${name} class="${that.#addClass()}">
          <template shadowroot="open">
            <slot></slot>${that.#addCss() ?? ''}
          </template>
          ${addHtml(that.#html[0])}
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
            this.innerHTML = ''
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
