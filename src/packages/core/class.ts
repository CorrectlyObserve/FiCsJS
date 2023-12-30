import generate from './generator'
import addQueue from './queue'
import symbol from './symbol'
import {
  ClassName,
  Css,
  Events,
  Html,
  Method,
  Props,
  PropsChain,
  Reflections,
  Sanitized,
  Value,
  Wely
} from './types'

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
  readonly #className: ClassName<D, P> | undefined = undefined
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
  #isReflected: boolean = false

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
      if (className) this.#className = className

      this.#html = typeof html === 'function' ? html : { ...html }

      if (css && css.length > 0) this.#css = [...css]
      if (events && events.length > 0) this.#events = [...events]
    }
  }

  #toKebabCase(str: string = this.#name): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  #getTagName(): string {
    return `w-${this.#toKebabCase()}`
  }

  #setProps(key: keyof P, value: P[typeof key]): void {
    if (!(key in this.#props)) throw Error(`${key as string} is not defined in props...`)
    else if (this.#props[key] !== value) {
      this.#props[key] = value
      addQueue({ welyId: this.#welyId, reRender: () => this.#reRender() })
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

  #getProperty<D, P>(property: Value<unknown, D, P>) {
    return typeof property === 'function'
      ? property({ data: { ...this.#data }, props: { ...this.#props } })
      : property
  }

  #getStyle(css: Css<D, P> = this.#css): string {
    if (css.length > 0) return <string>css.reduce((prev, curr) => {
        if (typeof curr !== 'string' && curr.selector && 'style' in curr) {
          const style =
            '{' +
            Object.entries(this.#getProperty(curr.style))
              .map(([key, value]) => `${this.#toKebabCase(key)}: ${value};`)
              .join('\n') +
            '}'

          return `${prev}${curr.selector}${style}`
        }

        return `${prev}${curr}`
      }, '')

    return ''
  }

  #renderOnServer(propsChain: PropsChain<P>): string {
    const tagName: string = this.#getTagName()

    if (this.#isOnlyCsr) return `<${tagName}></${tagName}>`

    this.#initializeProps(propsChain)

    const elements: Sanitized<D, P> | undefined = this.#getProperty(this.#html)[symbol]

    if (elements) {
      const className: string = this.#className ? ` ${this.#getProperty(this.#className)}` : ''

      return `
        <${tagName} class="${this.#toKebabCase()}${className}">
          <template shadowrootmode="open">
            ${this.#css.length > 0 ? `<style>${this.#getStyle()}</style>` : ''}
            ${elements.reduce(
              (prev, curr) =>
                prev +
                (curr instanceof WelyElement ? curr.#renderOnServer(this.#propsChain) : curr),
              ''
            )}
          </template>
        </${tagName}>
      `.trim()
    }

    throw Error(
      `${this.#name} has to use html function (tagged template literal) in html argument.`
    )
  }

  #addClassName(wely: HTMLElement, isReset?: boolean): void {
    if (isReset) wely.classList.remove(...Array.from(wely.classList))
    else if (typeof this.#className === 'function') this.#dataBindings.className = true

    this.#className
      ? wely.setAttribute('class', `${this.#toKebabCase()} ${this.#getProperty(this.#className)}`)
      : wely.classList.add(this.#toKebabCase())
  }

  #addHtml(shadowRoot: ShadowRoot, isReset?: boolean): void {
    if (isReset) shadowRoot.innerHTML = ''
    else this.#dataBindings.html = typeof this.#html === 'function'

    const elements: Sanitized<D, P> | undefined = this.#getProperty(this.#html)[symbol]

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

  #addCss(shadowRoot: ShadowRoot, css: Css<D, P> = []): string | void {
    if (this.#css.length > 0) {
      if (css.length === 0)
        for (const [index, content] of this.#css.entries()) {
          if (
            typeof content !== 'string' &&
            'style' in content &&
            typeof content.style === 'function'
          )
            this.#dataBindings.css.push(index)
          else continue
        }

      const stylesheet: CSSStyleSheet = new CSSStyleSheet()
      const style: Css<D, P> | undefined =
        css.length > 0 ? Array.from(new Set([...this.#css, ...css])) : undefined

      shadowRoot.adoptedStyleSheets = [stylesheet]
      stylesheet.replaceSync(this.#getStyle(style))
    }
  }

  #getShadowRoot(wely: HTMLElement): ShadowRoot {
    if (wely.shadowRoot) return wely.shadowRoot

    throw Error(`${this.#name} does not have shadowRoot...`)
  }

  #addEventHandler(
    wely: HTMLElement,
    event: { selector?: string; handler: string; method: Method<D, P> },
    isReset?: boolean
  ): void {
    const { selector, handler, method } = event

    if (selector) {
      const getSelectors = (selector: string): Element[] =>
        Array.from((<ShadowRoot>wely.shadowRoot).querySelectorAll(`:host ${selector}`))
      const elements: Element[] = []

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
        for (const element of elements) {
          const methodFunc = (event: Event): void =>
            method(
              {
                data: { ...this.#data },
                setData: (key: keyof D, value: D[typeof key]) => this.setData(key, value),
                props: { ...this.#props }
              },
              event
            )

          if (isReset) element.removeEventListener(handler, (event: Event) => methodFunc(event))

          element.addEventListener(handler, (event: Event) => methodFunc(event))
        }
      else
        console.error(`:host ${selector} does not exist or is not applicable in ${this.#name}...`)
    }
  }

  #addEvents(wely: HTMLElement): void {
    if (this.#events.length > 0)
      this.#events.forEach((event, index) => {
        const { selector, handler, method } = event

        if (selector) {
          this.#dataBindings.events.push(index)
          this.#addEventHandler(wely, event)
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
    this.#addClassName(wely)
    this.#addHtml(this.#getShadowRoot(wely))
    this.#addCss(this.#getShadowRoot(wely))
    this.#addEvents(wely)

    if (!this.#component) this.#component = wely

    return this.#component
  }

  #reRender(): void {
    if (this.#component) {
      const { className, html, css, events } = this.#dataBindings

      if (className) this.#addClassName(this.#component, true)

      if (html) this.#addHtml(this.#getShadowRoot(this.#component), true)

      if (css.length > 0)
        this.#addCss(
          this.#getShadowRoot(this.#component),
          css.map(index => this.#css[index])
        )

      if (events.length > 0)
        for (const index of events) {
          const { selector } = this.#events[index]

          if (selector) this.#addEventHandler(this.#component, this.#events[index], true)
        }
    }
  }

  getData<K extends keyof D>(key: K): D[typeof key] {
    if (key in this.#data) return this.#data[key]

    throw Error(`${key as string} is not defined in data...`)
  }

  setData(key: keyof D, value: D[typeof key]): void {
    if (this.#isReflected) throw Error(`${key as string} is not changed in reflections...`)
    else if (!(key in this.#data)) throw Error(`${key as string} is not defined in data...`)
    else if (this.#data[key] !== value) {
      this.#data[key] = value
      addQueue({ welyId: this.#welyId, reRender: () => this.#reRender() })

      this.#propsTrees.find(tree => tree.dataKey === key)?.setProps(value as unknown as P[keyof P])

      if (this.#reflections && key in this.#reflections) {
        this.#isReflected = true
        this.#reflections[key](this.#data[key])
        this.#isReflected = false
      }
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
              that.#addClassName(this)
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
