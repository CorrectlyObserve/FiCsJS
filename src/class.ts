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
  readonly #tagName: string = ''
  readonly #class: string = ''
  readonly #inheritances: Inheritances<T, D, P> = []
  readonly #data: D = <D>{}
  readonly #html: Html<T, D, P>[] = []
  readonly #css: Css<D, P> = []
  readonly #slot: Slot<T, D, P>[] = []
  readonly #events: Events<D, P> = []
  readonly #ssr: { props?: P; css?: Css<D, P> } | undefined = undefined

  #propsChain: PropsChain<P> = <PropsChain<P>>{ descendants: new Set(), chains: {} }
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
    events,
    ssr
  }: <T, D, P>) {
    this.#Id = Id ?? `-id${generator.next().value}`
    this.#name = name
    this.#tagName = this.#convertCase(this.#name, 'kebab')

    if (className) this.#class = className
    if (inheritances && inheritances.length > 0) this.#inheritances = [...inheritances]
    if (data) this.#data = { ...data() }

    this.#html.push(html)

    if (css && css.length > 0) this.#css = [...css]
    if (slot) this.#slot.push(slot)
    if (events && events.length > 0) this.#events = [...events]
    if (ssr) this.#ssr = ssr
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
    { Id, data }: { Id?: string; data?: () => D } = {
      Id: this.#Id,
      data: () => <D>{ ...this.#data }
    }
  ): Class<T, D, P> {
    return new Class<T, D, P>({
      Id,
      name: this.#name,
      className: this.#class,
      inheritances: this.#inheritances,
      data,
      html: this.#html[0],
      css: this.#css,
      slot: this.#slot.length > 0 ? this.#slot[0] : undefined,
      events: this.#events,
      ssr: this.#ssr
    })
  }

  #getTagName(): string {
    return `w-${this.#tagName}`
  }

  #getClass(): string {
    return this.#class.split(' ').reduce((prev, current) => `${prev} ${current}`, this.#tagName)
  }

  #addClass(: HTMLElement): void {
    this.#class === ''
      ? .classList.add(this.#tagName)
      : .setAttribute('class', this.#getClass())
  }

  #setProps(
    propsChain: PropsChain<P> = <PropsChain<P>>{ descendants: new Set(), chains: {} }
  ): void {
    if (this.#inheritances.length > 0)
      for (const inheritance of this.#inheritances) {
        const { descendants, props } = inheritance

        for (const descendant of this.#toArray(descendants)) {
          const Id = descendant.#Id

          if (propsChain.descendants.has(Id)) {
            const setPropsChain = (chain: Record<string, P | any>): void => {
              const currentChain = chain[this.#convertCase(Id, 'camel')]!

              if (currentChain.isPrototypeOf()) setPropsChain(Object.getPrototypeOf(currentChain))
              else currentChain.__proto__ = { ...props(this.#data) }
            }

            setPropsChain(propsChain.chains)
          } else {
            propsChain.descendants.add(Id)
            propsChain.chains[this.#convertCase(Id, 'camel')] = { ...props(this.#data) }
          }
        }
      }

    this.#propsChain = propsChain

    if (this.#propsChain.descendants.has(this.#Id))
      for (const key in this.#propsChain.chains[this.#convertCase(this.#Id, 'camel')])
        this.#props[key] = this.#propsChain.chains[this.#convertCase(this.#Id, 'camel')][key]
  }

  #insert(
    arg: SingleOrArray<Class<T, D, P> | string>,
    : HTMLElement | ShadowRoot,
    propsChain: PropsChain<P>
  ): void {
    for (const element of this.#toArray(arg))
      .appendChild(
        element instanceof Class
          ? <HTMLElement>element.#render(propsChain)
          : document.createRange().createContextualFragment(element)
      )
  }

  #addHtml(shadowRoot: ShadowRoot, propsChain: PropsChain<P>): void {
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

  #addSlot(: HTMLElement, propsChain: PropsChain<P>) {
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

  #addEvents(: HTMLElement): void {
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

    const  = that.#component || document.createElement(this.#getTagName())

    that.#addClass()
    that.#setProps(propsChain)
    that.#addHtml(<ShadowRoot>.shadowRoot, that.#propsChain)
    that.#addCss(this.#css, <ShadowRoot>.shadowRoot)
    that.#addSlot(, that.#propsChain)
    that.#addEvents()

    if (!that.#component) that.#component = 

    return 
  }

  #createHtml(Class: Class<T, D, P>, props: P, css?: Css<D, P>): string {
    const tagName = Class.#getTagName()
    const createTemplate = (html: any) =>
      `
        <${tagName}
          class="${Class.#class === '' ? Class.#tagName : Class.#getClass()}"
          id="${tagName}"
        >
          <template shadowroot="open">
            <slot></slot>
            ${
              css || Class.#css.length > 0
                ? `<style>${Class.#addCss(css || Class.#css)}</style>`
                : ''
            }
            <script id="-ssr-json" type="application/json">
              {
                "Id": "${Class.#Id}"
              }
            </script>
          </template>
          ${html}
        </${tagName}>
      `.trim()

    const html: Html<T, D, P> =
      typeof Class.#html[0] === 'function'
        ? Class.#html[0]({ data: { ...this.#data }, props: { ...props } })
        : Class.#html[0]

    if (typeof html === 'string' || html instanceof Class || Array.isArray(html)) {
    } else if ('contents' in <Each<T, D, P> | EachIf<T, D, P>>html) {
      this.#isEach = true

      if ('branches' in <EachIf<T, D, P>>html) {
        const { contents, branches, fallback } = <EachIf<T, D, P>>html

        contents.forEach((content, index) => {
          for (const branch of branches)
            if (branch.judge(content)) {
            }

          if (fallback) {
          }
        })
      } else {
        const { contents, render } = <Each<T, D, P>>html

        contents.forEach((content, index) => {
          const renderer = render(content, index)
          if (renderer) {
          }
        })
      }
    } else {
      const { branches, fallback } = <If<T, D, P>>html
      let isInserted = false

      for (const branch of branches)
        if (branch.judge) {
          isInserted = true
        }

      if (!isInserted && fallback) {
      }
    }

    return createTemplate(null)
  }

  overwrite(partialData: () => Partial<D>): Class<T, D, P> {
    const instance = this.#clone({
      Id: undefined,
      data: () => <D>{ ...this.#data, ...partialData() }
    })

    return instance
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

  onServer(props?: P, css?: Css<D, P>): string {
    return this.#createHtml(this.#clone(), props ?? <P>{}, css)
  }
}
