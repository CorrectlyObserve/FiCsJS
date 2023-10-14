import generator from './generator'
import {
  Css,
  Each,
  EachIf,
  EventHandler,
  Html,
  HtmlOrSlot,
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
  readonly #tagName: string = ''
  readonly #class: string = ''
  readonly #inheritances: Inheritances<T, D, P> = []
  readonly #data: D = <D>{}
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
    html,
    css,
    ssrCss,
    slot,
    events
  }: Wely<T, D, P>) {
    this.#welyId = welyId ?? `wely-id${generator.next().value}`
    this.#name = name
    this.#tagName = this.#convertCase(this.#name, 'kebab')

    if (className && className !== '') this.#class = className
    if (inheritances && inheritances.length > 0) this.#inheritances = [...inheritances]
    if (data) this.#data = { ...data() }

    this.#html.push(html)

    if (css && css.length > 0) this.#css = [...css]
    if (ssrCss && ssrCss.length > 0) this.#ssrCss = [...ssrCss]
    if (slot) this.#slot.push(slot)
    if (events && events.length > 0) this.#events = [...events]
  }

  #convertCase(str: string, type: 'camel' | 'kebab'): string {
    if (type === 'camel')
      return str.replace(/-+(.)?/g, (_, targets) => (targets ? targets.toUpperCase() : ''))

    if (type === 'kebab') return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

    return str
  }

  #toArray(val: unknown | unknown[]) {
    return Array.isArray(val) ? [...val] : [val]
  }

  #clone(
    { welyId, data }: { welyId?: string; data?: () => D } = {
      welyId: this.#welyId,
      data: () => <D>{ ...this.#data }
    }
  ): WelyClass<T, D, P> {
    return new WelyClass<T, D, P>({
      welyId,
      name: this.#name,
      className: this.#class,
      inheritances: this.#inheritances,
      data,
      html: this.#html[0],
      css: this.#css,
      ssrCss: this.#ssrCss,
      slot: this.#slot.length > 0 ? this.#slot[0] : undefined,
      events: this.#events
    })
  }

  #getTagName(): string {
    return `w-${this.#tagName}`
  }

  #getClass(): string {
    return this.#class.split(' ').reduce((prev, current) => `${prev} ${current}`, this.#tagName)
  }

  #addClass(wely: HTMLElement): void {
    this.#class === ''
      ? wely.classList.add(this.#tagName)
      : wely.setAttribute('class', this.#getClass())
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
            const setPropsChain = (chain: Record<string, P | any>): void => {
              const currentChain = chain[this.#convertCase(welyId, 'camel')]!

              if (currentChain.isPrototypeOf()) setPropsChain(Object.getPrototypeOf(currentChain))
              else currentChain.__proto__ = { ...props(this.#data) }
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

  #convertHtml(html: Html<T, D, P> | Slot<T, D, P> = this.#html[0]): HtmlOrSlot<T, D, P> {
    return typeof html === 'function'
      ? html({ data: { ...this.#data }, props: { ...this.#props } })
      : html
  }

  #appendChild(
    arg: SingleOrArray<WelyClass<T, D, P> | string>,
    wely: HTMLElement | ShadowRoot,
    propsChain: PropsChain<P>
  ): void {
    for (const element of this.#toArray(arg))
      wely.appendChild(
        element instanceof WelyClass
          ? element.#render(propsChain)
          : document.createRange().createContextualFragment(element)
      )
  }

  #addHtml(shadowRoot: ShadowRoot, propsChain: PropsChain<P>): void {
    const html: Html<T, D, P> = this.#convertHtml()

    if (typeof html === 'string' || html instanceof WelyClass || Array.isArray(html))
      this.#appendChild(html, shadowRoot, propsChain)
    else if ('contents' in <Each<T, D, P> | EachIf<T, D, P>>html) {
      this.#isEach = true

      if ('branches' in <EachIf<T, D, P>>html) {
        const { contents, branches, fallback } = <EachIf<T, D, P>>html

        contents.forEach((content, index) => {
          for (const branch of branches)
            if (branch.judge(content))
              this.#appendChild(branch.render(content, index), shadowRoot, propsChain)

          if (fallback) this.#appendChild(fallback(content, index), shadowRoot, propsChain)
        })
      } else {
        const { contents, render } = <Each<T, D, P>>html

        contents.forEach((content, index) => {
          const renderer = render(content, index)
          if (renderer) this.#appendChild(renderer, shadowRoot, propsChain)
        })
      }
    } else {
      const { branches, fallback } = <If<T, D, P>>html
      let isInserted = false

      for (const branch of branches)
        if (branch.judge) {
          this.#appendChild(branch.render, shadowRoot, propsChain)
          isInserted = true
        }

      if (!isInserted && fallback) this.#appendChild(fallback, shadowRoot, propsChain)
    }
  }

  #addCss(css: Css<D, P>, shadowRoot?: ShadowRoot): string | void {
    if (css.length > 0) {
      let styleContent = ''

      css.forEach(cssObj => {
        if (typeof cssObj === 'string') styleContent += cssObj
        else if (cssObj.selector && 'style' in cssObj)
          styleContent +=
            cssObj.selector +
            `{${Object.entries(cssObj.style({ data: { ...this.#data }, props: { ...this.#props } }))
              .map(([key, value]) => `${this.#convertCase(key, 'kebab')}: ${value};`)
              .join('\n')}}`
      })

      if (!shadowRoot) return styleContent

      const stylesheet = new CSSStyleSheet()
      shadowRoot!.adoptedStyleSheets = [stylesheet]
      stylesheet.replace(`${styleContent}`)
    }
  }

  #addSlot(wely: HTMLElement, propsChain: PropsChain<P>): void {
    if (this.#slot.length > 0)
      for (const slot of this.#toArray(this.#slot))
        this.#appendChild(
          <WelyClass<T, D, P> | string>this.#convertHtml(<Slot<T, D, P>>slot),
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

    const wely = that.#component || document.createElement(this.#getTagName())

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

    if (that.#slot.length > 0)
      throw Error(`${that.#name} cannot use slot in server side rendering...`)
    else {
      that.#setProps(propsChain)

      const insertTemplate = (
        arg: SingleOrArray<WelyClass<T, D, P> | string>,
        propsChain: PropsChain<P>
      ): string => {
        let html: string = ''

        for (const element of this.#toArray(arg))
          html += element instanceof WelyClass ? element.#renderOnServer(propsChain) : element

        return html
      }

      const addHtml = (instance: WelyClass<T, D, P>, propsChain: PropsChain<P>) => {
        const html: Html<T, D, P> = instance.#convertHtml()

        if (typeof html === 'string' || html instanceof WelyClass || Array.isArray(html))
          return insertTemplate(html, propsChain)

        if ('contents' in <Each<T, D, P> | EachIf<T, D, P>>html) {
          instance.#isEach = true

          if ('branches' in <EachIf<T, D, P>>html) {
            const { contents, branches, fallback } = <EachIf<T, D, P>>html

            contents.forEach((content, index) => {
              for (const branch of branches)
                if (branch.judge(content))
                  return insertTemplate(branch.render(content, index), propsChain)

              if (fallback) return insertTemplate(fallback(content, index), propsChain)

              return
            })

            return
          }

          const { contents, render } = <Each<T, D, P>>html

          contents.forEach((content, index) => {
            const renderer = render(content, index)
            if (renderer) return insertTemplate(renderer, propsChain)

            return
          })
        }

        const { branches, fallback } = <If<T, D, P>>html

        for (const branch of branches)
          if (branch.judge) return insertTemplate(branch.render, propsChain)

        if (fallback) return insertTemplate(fallback, propsChain)

        return
      }

      const createStringHtml = (
        instance: WelyClass<T, D, P>,
        propsChain: PropsChain<P>
      ): string => {
        const tagName = instance.#getTagName()

        const getDataOrProps = (arg: D | P): D | P => {
          const getDataOrProps: Record<string, unknown> = {}

          const getValue = (key: string): unknown => {
            if ((<Record<string, unknown>>arg).hasOwnProperty(key)) {
              const value = (<Record<string, unknown>>arg)[key]

              if (Array.isArray(value)) return [...value]

              if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype)
                return { ...value }

              return typeof value === 'function' ? `'${value}'` : value
            }

            return
          }

          Object.keys(arg ?? {}).forEach(key => (getDataOrProps[key] = getValue(key)))

          return <D | P>getDataOrProps
        }

        return `
          <${tagName}
            class="${instance.#class === '' ? instance.#tagName : instance.#getClass()}"
            id="${tagName}"
            created-by="wely-js"
          >
            <template shadowroot="open">
              <slot></slot>
              ${
                instance.#css.length > 0 || instance.#ssrCss.length > 0
                  ? `<style>${instance.#addCss([...instance.#css, ...instance.#ssrCss])}</style>`
                  : ''
              }
              <script type="application/json">
                ${JSON.stringify({
                  welyId: instance.#welyId,
                  name: instance.#name,
                  class: instance.#class,
                  data: <D>getDataOrProps(instance.#data),
                  props: <P>getDataOrProps(instance.#props),
                  html: that.#convertHtml(instance.#html[0]),
                  css: instance.#css,
                  events: instance.#events.map(event => {
                    const eventObj: { handler: string; selector?: string; method: string } = {
                      handler: '',
                      method: ''
                    }

                    Object.keys(event).forEach(key => {
                      const eventKey = <'handler' | 'selector' | 'method'>key

                      eventObj[eventKey] =
                        eventKey === 'method' ? `'${event[eventKey]}'` : `${event[eventKey]}`
                    })

                    return eventObj
                  })
                })}
              </script>
            </template>
            ${addHtml(instance, propsChain)}
          </${tagName}>
        `.trim()
      }

      return createStringHtml(that, that.#propsChain)
    }
  }

  overwrite(partialData: () => Partial<D>): WelyClass<T, D, P> {
    return this.#clone({
      welyId: undefined,
      data: () => <D>{ ...this.#data, ...partialData() }
    })
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
