import {
  ClassName,
  Css,
  Descendant,
  Events,
  Html,
  NamedSlot,
  Props,
  PropsChain,
  Wely
} from './types'
import { generator, symbol } from './utils'

export class WelyElement<D, P> {
  readonly #welyId: string
  readonly #name: string
  readonly #data: D = <D>{}
  readonly #props: Props<D> = []
  readonly #isOnlyCsr: boolean = false
  readonly #className: ClassName<D, P>[] = []
  readonly #html: Html<D, P>[] = []
  readonly #css: Css<D, P> = []
  readonly #ssrCss: Css<D, P> = []
  readonly #slot: Html<D, P>[] | (Html<D, P> | NamedSlot<D, P>)[] = []
  readonly #events: Events<D, P> = []

  #propsChain: PropsChain<P> = <PropsChain<P>>{ descendants: new Set(), chains: {} }
  #inheritedProps: P = <P>{}
  #component: HTMLElement | undefined = undefined

  constructor({
    welyId,
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
  }: Wely<D, P>) {
    this.#welyId = welyId ?? `wely${generator.next().value}`
    this.#name = name

    if (data) this.#data = { ...data() }
    if (props && props.length > 0) this.#props = [...props]

    if (isOnlyCsr) this.#isOnlyCsr = true
    if (className && className !== '') this.#className.push(className)
    this.#html.push(html)

    if (css && css.length > 0) this.#css = [...css]
    if (ssrCss && ssrCss.length > 0) this.#ssrCss = [...ssrCss]

    if (slot) this.#slot = Array.isArray(slot) ? [...slot] : [slot]
    if (events && events.length > 0) this.#events = [...events]
  }

  #clone(
    { welyId, data }: { welyId?: string; data?: () => D } = {
      welyId: this.#welyId,
      data: () => <D>{ ...this.#data }
    }
  ): WelyElement<D, P> {
    return new WelyElement<D, P>({
      welyId,
      name: this.#name,
      data,
      props: this.#props,
      isOnlyCsr: this.#isOnlyCsr,
      className: this.#className[0],
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
          if (propsChain.descendants.has(descendant.#welyId)) {
            const setPropsChain = (chain: Record<string, any>): void => {
              const localChain = chain[descendant.#welyId]

              if (localChain.isPrototypeOf()) setPropsChain(Object.getPrototypeOf(localChain))
              else localChain.__proto__ = { ...values(this.#data) }
            }

            setPropsChain(propsChain.chains)
          } else {
            propsChain.descendants.add(descendant.#welyId)
            propsChain.chains[descendant.#welyId] = { ...values(this.#data) }
          }
      }

    this.#propsChain = propsChain

    if (this.#propsChain.descendants.has(this.#welyId))
      for (const key in this.#propsChain.chains[this.#welyId])
        this.#inheritedProps[key] = this.#propsChain.chains[this.#welyId][key]
  }

  #convert<A, R>(arg: A): R {
    return typeof arg === 'function'
      ? arg({ data: { ...this.#data }, props: { ...this.#inheritedProps } })
      : arg
  }

  #addClassName(wely?: HTMLElement): string | void {
    const className =
      this.#toKebabCase(this.#name) +
      (this.#className.length > 0
        ? ` ${this.#convert<ClassName<D, P>, string>(this.#className[0])}`
        : '')

    if (!wely) return className
    wely.setAttribute('class', className)
  }

  #convertHtml(html: Html<D, P>): (WelyElement<D, P> | string)[] | undefined {
    return this.#convert<Html<D, P>, Record<symbol, (Descendant | string)[]>>(html)[symbol]
  }

  #addHtml(shadowRoot: ShadowRoot, html: Html<D, P>): void {
    const elements = this.#convertHtml(html)

    if (elements)
      for (const element of elements) {
        if (element instanceof WelyElement) {
          if (element.#getTagName() === 'w-wely-slot') {
            if (this.#slot.length > 0) {
              const slotName = this.#convertHtml(element.#html[0])?.[0] ?? ''

              if (slotName === '') {
                if (this.#slot.some(slot => 'name' in slot && 'values' in slot)) {
                  const slot = <Html<D, P> | undefined>(
                    this.#slot.find(slot => !('name' in slot && 'values' in slot))
                  )

                  if (slot) this.#addHtml(shadowRoot, slot)
                  else throw Error(`${this.#name} has no unnamed slot...`)
                } else this.#addHtml(shadowRoot, <Html<D, P>>this.#slot[0])
              } else {
                const slot = <NamedSlot<D, P>>(
                  this.#slot.find(
                    slot => 'name' in slot && 'values' in slot && slot.name === slotName
                  )
                )

                if (slot) this.#addHtml(shadowRoot, slot.values)
                else throw Error(`${this.#name} has no ${slotName} slot...`)
              }
            } else throw Error(`${this.#name} has no slot...`)
          } else shadowRoot.appendChild(element.#render(this.#propsChain))
        } else shadowRoot.appendChild(document.createRange().createContextualFragment(element))
      }
    else
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

  #addEvents(wely: HTMLElement): void {
    if (this.#events.length > 0)
      for (const event of this.#events) {
        const { selector, handler, method } = event

        const elements = selector
          ? (() => {
              const getSelectors = (selector: string) =>
                Array.from((<ShadowRoot>wely.shadowRoot).querySelectorAll(`:host ${selector}`))

              if (/^.+(\.|#).+$/.test(selector)) {
                const prefix = selector.includes('.') ? '.' : '#'
                const [tag, attr] = selector.split(prefix)

                return getSelectors(tag).filter(
                  element => element.getAttribute(prefix === '.' ? 'class' : 'id') === attr
                )
              }

              return getSelectors(selector)
            })()
          : [wely]

        if (elements.length > 0)
          for (const element of elements)
            element.addEventListener(handler, (event: Event) =>
              method({ data: { ...this.#data }, props: { ...this.#inheritedProps } }, event)
            )
        else console.error(`:host ${selector} does not exist or is not applicable...`)
      }
  }

  #createComponent(wely: HTMLElement, propsChain?: PropsChain<P>): void {
    this.#setProps(propsChain)
    this.#addClassName(wely)
    this.#addHtml(<ShadowRoot>wely.shadowRoot, this.#html[0])
    this.#addCss(<ShadowRoot>wely.shadowRoot)
    this.#addEvents(wely)
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

    const wely = that.#component ?? document.createElement(name)

    that.#createComponent(wely, propsChain)

    if (!that.#component) that.#component = wely

    return wely
  }

  #renderOnServer(propsChain?: PropsChain<P>): string {
    const that = this.#clone()
    const name = that.#getTagName()

    if (that.#isOnlyCsr) return `<${name}></${name}>`

    that.#setProps(propsChain)

    const addHtml = (html: Html<D, P>): string => {
      const elements = that.#convertHtml(html)

      if (elements) return <string>elements.reduce((prev, curr) => {
          if (curr instanceof WelyElement) {
            if (curr.#getTagName() === 'w-wely-slot') {
              if (that.#slot.length > 0) {
                const slotName = that.#convertHtml(curr.#html[0])?.[0] ?? ''

                if (slotName === '') {
                  if (that.#slot.some(slot => 'name' in slot && 'values' in slot)) {
                    const slot = <Html<D, P> | undefined>(
                      that.#slot.find(slot => !('name' in slot && 'values' in slot))
                    )

                    if (slot) return prev + addHtml(slot)

                    throw Error(`${that.#name} has no unnamed slot...`)
                  } else return prev + addHtml(<Html<D, P>>that.#slot[0])
                } else {
                  const slot = <NamedSlot<D, P>>(
                    that.#slot.find(
                      slot => 'name' in slot && 'values' in slot && slot.name === slotName
                    )
                  )

                  if (slot) return prev + addHtml(slot.values)

                  throw Error(`${that.#name} has no ${slotName} slot...`)
                }
              } else throw Error(`${that.#name} has no slot...`)
            }

            return prev + curr.#renderOnServer(that.#propsChain)
          }

          return prev + curr
        }, '')

      throw Error(
        `${that.#name} has to use html function (tagged template literal) in html argument.`
      )
    }

    return `
        <${name} class="${that.#addClassName()}">
          <template shadowroot="open">
            <slot></slot>${that.#addCss() ?? ''}
          </template>
          ${addHtml(that.#html[0])}
        </${name}>
      `.trim()
  }

  overwrite(partialData: () => Partial<D>): WelyElement<D, P> {
    return this.#clone({ welyId: undefined, data: () => <D>{ ...this.#data, ...partialData() } })
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
