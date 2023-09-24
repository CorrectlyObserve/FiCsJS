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
  readonly #tagName: string = ''
  readonly #class: string = ''
  readonly #inheritances: Inheritances<T, D, P> = []
  readonly #data: D = <D>{}
  readonly #html: Html<T, D, P>[] = []
  readonly #css: Css<D, P> = []
  readonly #slot: Slot<T, D, P>[] = []
  readonly #events: Events<D, P> = []

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
    slot,
    events
  }: Wely<T, D, P>) {
    this.#welyId = welyId ?? `wely-id${generator.next().value}`
    this.#name = name
    this.#tagName = this.#convertCase(this.#name, 'kebab')

    if (className) this.#class = className
    if (inheritances && inheritances.length > 0) this.#inheritances = [...inheritances]
    if (data) this.#data = { ...data() }

    this.#html.push(html)

    if (css && css.length > 0) this.#css = [...css]
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
      welyId: welyId,
      name: this.#name,
      className: this.#class,
      inheritances: this.#inheritances,
      data: data,
      html: this.#html[0],
      css: this.#css,
      slot: this.#slot.length > 0 ? this.#slot[0] : undefined,
      events: this.#events
    })
  }

  #getTagName(): string {
    return `w-${this.#tagName}`
  }

  #getClass(): string {
    if (this.#class === '') return this.#tagName
    return this.#class.split(' ').reduce((prev, current) => `${prev} ${current}`, this.#tagName)
  }

  #setClass(wely: HTMLElement): void {
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

  #insert(
    arg: SingleOrArray<WelyClass<T, D, P> | string>,
    wely: HTMLElement | ShadowRoot,
    propsChain: PropsChain<P>
  ): void {
    for (const element of this.#toArray(arg))
      wely.appendChild(
        element instanceof WelyClass
          ? <HTMLElement>element.#render(propsChain)
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

  #setCss(css: Css<D, P>, shadowRoot?: ShadowRoot): string | void {
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

    that.#setClass(wely)
    that.#setProps(propsChain)
    that.#setHtml(<ShadowRoot>wely.shadowRoot, that.#propsChain)
    that.#setCss(this.#css, <ShadowRoot>wely.shadowRoot)
    that.#setSlot(wely, that.#propsChain)
    that.#setEvents(wely)

    if (!that.#component) that.#component = wely

    return wely
  }

  // #getHtmlStr(welyClass: WelyClass<T, D, P>, css: Css<D, P>): string {
  //   console.log(welyClass.#html)

  //   // for(const child of children) welyClass.#getHtmlStr()

  //   const tagName = welyClass.#getTagName()

  //   return `
  //     <${tagName}
  //       class="${welyClass.#getClass()}"
  //       id="${tagName}"
  //     >
  //       <template shadowroot="open">
  //         <slot></slot>
  //         <style>${welyClass.#setCss(css)}</style>
  //         <script id="ssr-json" type="application/json">
  //           {
  //             "welyId": "${welyClass.#welyId}"
  //           }
  //         </script>
  //       </template>
  //     </${tagName}>
  //   `.trim()
  // }

  overwrite(partialData: () => Partial<D>): WelyClass<T, D, P> {
    const instance = this.#clone({
      welyId: undefined,
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
              that.#setClass(this)
              that.#setProps()
              that.#setHtml(this.shadowRoot, that.#propsChain)
              that.#setCss(that.#css, this.shadowRoot)
              that.#setSlot(this, that.#propsChain)
              that.#setEvents(this)

              this.#isRendered = true
            }
          }
        }
      )
  }

  // ssr(css: Css<D, P>): string {
  //   return this.#getHtmlStr(this.#clone(), css)
  // }
}
