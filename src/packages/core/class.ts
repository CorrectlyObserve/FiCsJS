import generate from './generator'
import setQueue from './queue'
import symbol from './symbol'
import { Class, Css, Events, Html, Props, PropsChain, Reflections, Sanitized, Wely } from './types'

const generator: Generator<number> = generate()

export default class WelyElement<D extends object, P extends object> {
  readonly #reservedWords: string[] = []
  readonly #welyId: string
  readonly #name: string
  readonly #data: D = <D>{}
  readonly #reflections: Reflections<D> | undefined = undefined
  readonly #inheritances: Props<D> = []
  readonly #props: P = <P>{}
  readonly #isOnlyCsr: boolean = false
  readonly #class: Class<D, P> | undefined = undefined
  readonly #html: Html<D, P> = { [symbol]: [] }
  readonly #css: Css<D, P> = []
  readonly #events: Events<D, P> = []

  readonly #propsTrees: {
    descendantId: string
    dataKey: string
    propsKey: keyof P
    setProps: (value: P[keyof P]) => void
  }[] = []
  readonly #dataBindings: { className: boolean; html: boolean; css: number[]; events: number[] } = {
    className: false,
    html: false,
    css: [],
    events: []
  }

  #propsChain: PropsChain<P> = new Map()
  #component: HTMLElement | undefined = undefined

  constructor({
    name,
    data,
    reflections,
    props,
    isOnlyCsr,
    className,
    html,
    css,
    events
  }: Wely<D, P>) {
    if (this.#reservedWords.includes(name)) throw Error(`${name} is a reserved word in WelyJS...`)
    else {
      this.#welyId = `wely${generator.next().value}`
      this.#name = name

      if (data) {
        if (reflections) {
          let hasError = false

          for (const key of Object.keys(reflections)) {
            if (key in data()) continue

            if (!hasError) hasError = true
            throw Error(`${key} is not defined in data...`)
          }

          if (!hasError) this.#reflections = { ...reflections }
        }

        for (const [key, value] of Object.entries(data())) this.#data[key as keyof D] = value
      }

      if (props && props.length > 0) this.#inheritances = [...props]

      if (isOnlyCsr) this.#isOnlyCsr = true
      if (className) this.#class = className

      this.#html = typeof html === 'function' ? html : { ...html }

      if (css && css.length > 0) this.#css = [...css]
      if (events && events.length > 0) this.#events = [...events]
    }
  }

  #toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  #getTagName(): string {
    return `w-${this.#toKebabCase(this.#name)}`
  }

  #setProps(key: keyof P, value: P[typeof key]): void {
    if (!(key in this.#props)) throw Error(`${key as string} is not defined in props...`)
    else if (this.#props[key] !== value) {
      this.#props[key] = value
      setQueue(() => this.#reRender(), this.#welyId)
    }
  }

  #initializeProps(propsChain: PropsChain<P>): void {
    if (this.#inheritances.length > 0)
      for (const { descendants, values } of this.#inheritances)
        for (const descendant of Array.isArray(descendants) ? descendants : [descendants]) {
          let dataKey: string = ''
          const data: [string, P][] = Object.entries({
            ...values((key: keyof D) => {
              dataKey = <string>key
              return this.getData(key)
            })
          })
          const descendantId: string = descendant.#welyId

          for (const [key, value] of data) {
            const chain: Record<string, P> = propsChain.get(descendantId) ?? {}

            if (!(key in chain) || !propsChain.has(descendantId)) {
              propsChain.set(descendantId, { ...chain, [key]: value })

              const propsKey = key as keyof P

              this.#propsTrees.push({
                descendantId,
                dataKey,
                propsKey,
                setProps: (value: P[keyof P]) => descendant.#setProps(propsKey, value)
              })
            } else continue
          }
        }

    this.#propsChain = new Map(propsChain)

    for (const [key, value] of Object.entries(this.#propsChain.get(this.#welyId) ?? {}))
      this.#props[key as keyof P] = value as P[keyof P]
  }

  #convertHtml(html: Html<D, P>): Sanitized<D, P> | undefined {
    return typeof html === 'function'
      ? html({ data: { ...this.#data }, props: { ...this.#props } })[symbol]
      : html[symbol]
  }

  #addCss(shadowRoot?: ShadowRoot): string | void {
    if (this.#css.length > 0) {
      const style = this.#css.reduce((prev, curr, index) => {
        if (typeof curr !== 'string' && curr.selector && 'style' in curr) {
          if (shadowRoot && typeof curr.style === 'function') this.#dataBindings.css.push(index)

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

      const stylesheet: CSSStyleSheet = new CSSStyleSheet()
      shadowRoot.adoptedStyleSheets = [stylesheet]
      stylesheet.replace(<string>style)
    }
  }

  #getClassName() {
    return this.#class
      ? `${this.#toKebabCase(this.#name)} ${
          typeof this.#class === 'function'
            ? this.#class({ data: { ...this.#data }, props: { ...this.#props } })
            : this.#class
        }`
      : this.#toKebabCase(this.#name)
  }

  #renderOnServer(propsChain: PropsChain<P>): string {
    const tagName: string = this.#getTagName()

    if (this.#isOnlyCsr) return `<${tagName}></${tagName}>`

    this.#initializeProps(propsChain)

    const addHtml = (html: Html<D, P>): string => {
      const elements = this.#convertHtml(html)

      if (elements)
        return <string>(
          elements.reduce(
            (prev, curr) =>
              prev + (curr instanceof WelyElement ? curr.#renderOnServer(this.#propsChain) : curr),
            ''
          )
        )

      throw Error(
        `${this.#name} has to use html function (tagged template literal) in html argument.`
      )
    }

    return `
        <${tagName} class="${this.#getClassName()}">
          <template shadowrootmode="open">
            ${this.#addCss() ?? ''}${addHtml(this.#html)}
          </template>
        </${tagName}>
      `.trim()
  }

  #addClass(wely: HTMLElement): void {
    if (typeof this.#class === 'function') this.#dataBindings.className = true
    wely.setAttribute('class', this.#getClassName())
  }

  #addHtml(shadowRoot: ShadowRoot, html: Html<D, P> = this.#html): void {
    const elements: Sanitized<D, P> | undefined = this.#convertHtml(html)

    this.#dataBindings.html = typeof html === 'function'

    if (elements)
      for (const element of elements)
        shadowRoot.appendChild(
          element instanceof WelyElement
            ? element.#component ?? element.#render(this.#propsChain)
            : document.createRange().createContextualFragment(element)
        )
    else
      throw Error(
        `${this.#name} has to use html function (tagged template literal) in html argument.`
      )
  }

  #getShadowRoot(wely: HTMLElement): ShadowRoot {
    if (wely.shadowRoot) return wely.shadowRoot

    throw Error(`${this.#name} does not have a shadowRoot...`)
  }

  #addEvents(wely: HTMLElement): void {
    if (this.#events.length > 0)
      this.#events.forEach((event, index) => {
        const { selector, handler, method } = event

        if (selector) {
          this.#dataBindings.events.push(index)

          const elements: Element[] = []
          const getSelectors = (selector: string): Element[] =>
            Array.from((<ShadowRoot>wely.shadowRoot).querySelectorAll(`:host ${selector}`))

          if (/^.+(\.|#).+$/.test(selector)) {
            const prefix = selector.includes('.') ? '.' : '#'
            const [tag, attr] = selector.split(prefix)

            elements.push(
              ...getSelectors(tag).filter(
                element => element.getAttribute(prefix === '.' ? 'class' : 'id') === attr
              )
            )
          } else elements.push(...getSelectors(selector))

          if (elements.length > 0)
            for (const element of elements)
              element.addEventListener(handler, (event: Event) =>
                method(
                  {
                    data: { ...this.#data },
                    setData: (key: keyof D, value: D[typeof key]) => this.setData(key, value),
                    props: { ...this.#props }
                  },
                  event
                )
              )
          else
            console.error(
              `:host ${selector} does not exist or is not applicable in ${this.#name}...`
            )
        } else
          wely.addEventListener(handler, (event: Event) =>
            method(
              {
                data: { ...this.#data },
                setData: (key: keyof D, value: D[typeof key]) => this.setData(key, value),
                props: { ...this.#props }
              },
              event
            )
          )
      })
  }

  #render(propsChain: PropsChain<P>): HTMLElement {
    const tagName: string = this.#getTagName()

    if (!customElements.get(tagName))
      customElements.define(
        tagName,
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }
        }
      )

    const wely = this.#component ?? document.createElement(tagName)

    this.#initializeProps(propsChain)
    this.#addClass(wely)
    this.#addHtml(this.#getShadowRoot(wely))
    this.#addCss(this.#getShadowRoot(wely))
    this.#addEvents(wely)

    if (!this.#component) this.#component = wely

    return this.#component
  }

  #reRender(): void {
    if (this.#component) {
      const { className, html, css, events } = this.#dataBindings

      if (className) {
        this.#component.classList.remove(...Array.from(this.#component.classList))
        this.#addClass(this.#component)
      }

      if (html) {
      }

      if (css.length > 0) {
      }

      if (events.length > 0) {
        for (const index of events) console.log(this.#events[index])
      }
    }
  }

  getData<K extends keyof D>(key: K): D[typeof key] {
    if (key in this.#data) return this.#data[key]

    throw Error(`${key as string} is not defined in data...`)
  }

  setData(key: keyof D, value: D[typeof key]): void {
    if (!(key in this.#data)) throw Error(`${key as string} is not defined in data...`)
    else if (this.#data[key] !== value) {
      this.#data[key] = value
      setQueue(() => this.#reRender(), this.#welyId)

      this.#propsTrees.find(tree => tree.dataKey === key)?.setProps(value as unknown as P[keyof P])

      if (this.#reflections && key in this.#reflections) this.#reflections[key](this.#data[key])
    }
  }

  ssr(): string {
    return this.#renderOnServer(this.#propsChain)
  }

  define(): void {
    if (!customElements.get(this.#getTagName())) {
      const that = this

      customElements.define(
        this.#getTagName(),
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot
          #isRendered: boolean = false

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }

          connectedCallback(): void {
            if (!this.#isRendered && this.shadowRoot.innerHTML.trim() === '') {
              that.#initializeProps(that.#propsChain)
              that.#addClass(this)
              that.#addHtml(that.#getShadowRoot(this))
              that.#addCss(that.#getShadowRoot(this))
              that.#addEvents(this)

              that.#component = this
              this.#isRendered = true
            }
          }
        }
      )
    }
  }
}
