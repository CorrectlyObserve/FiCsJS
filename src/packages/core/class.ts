import generate from './generator'
import addQueue from './queue'
import symbol from './symbol'
import {
  Action,
  ClassName,
  Css,
  FiCs,
  Html,
  Props,
  PropsChain,
  Reflections,
  Sanitized
} from './types'

const generator: Generator<number> = generate()

export default class FiCsElement<D extends object, P extends object> {
  readonly #reservedNames: Record<string, boolean> = { var: true }
  readonly #ficsId: string
  readonly #name: string
  readonly #data: D = {} as D
  readonly #reflections: Reflections<D> | undefined = undefined
  readonly #inheritances: Props<D> = new Array()
  readonly #props: P = {} as P
  readonly #isOnlyCsr: boolean = false
  readonly #className: ClassName<D, P> | undefined = undefined
  readonly #html: Html<D, P> = { [symbol]: new Array() }
  readonly #css: Css<D, P> = new Array()
  readonly #actions: Action<D, P>[] = new Array()

  readonly #propsTrees: {
    descendantId: string
    dataKey: string
    propsKey: keyof P
    setProps: (value: P[keyof P]) => void
  }[] = new Array()
  readonly #dataBindings: { className: boolean; html: boolean; css: number[]; actions: number[] } =
    { className: false, html: false, css: new Array(), actions: new Array() }
  readonly #generator: Generator<number> = generate()

  #propsChain: PropsChain<P> = new Map()
  #dom: DocumentFragment = new DocumentFragment()
  #component: HTMLElement | undefined = undefined
  #isReflecting: boolean = false

  constructor({
    name,
    data,
    reflections,
    props,
    isOnlyCsr,
    className,
    html,
    css,
    actions
  }: FiCs<D, P>) {
    const convertedName: string = this.#toKebabCase(name)

    if (this.#reservedNames[convertedName])
      throw new Error(`${name} is a reserved word in FiCsJS...`)
    else {
      this.#ficsId = `fics${generator.next().value}`
      this.#name = convertedName

      if (data) {
        if (reflections) {
          let hasError = false

          for (const key of Object.keys(reflections)) {
            if (key in data()) continue

            if (!hasError) hasError = true
            throw new Error(`${key} is not defined in data...`)
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
      if (actions && actions.length > 0) this.#actions = [...actions]
    }
  }

  #toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  #getTagName(): string {
    return `f-${this.#name}`
  }

  #setProps(key: keyof P, value: P[typeof key]): void {
    if (!(key in this.#props)) throw new Error(`${key as string} is not defined in props...`)
    else if (this.#props[key] !== value) {
      this.#props[key] = value
      addQueue({ ficsId: this.#ficsId, reRender: this.#reRender() })
    }
  }

  #initProps(propsChain: PropsChain<P>): void {
    if (this.#inheritances.length > 0)
      for (const { descendants, values } of this.#inheritances)
        for (const descendant of Array.isArray(descendants) ? descendants : [descendants]) {
          let dataKey: string = ''
          const data: [string, P][] = Object.entries({
            ...values((key: keyof D) => {
              dataKey = key as string
              return this.getData(key)
            })
          })
          const descendantId: string = descendant.#ficsId

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

    for (const [key, value] of Object.entries(this.#propsChain.get(this.#ficsId) ?? {}))
      this.#props[key as keyof P] = value as P[keyof P]
  }

  #getStyle(css: Css<D, P> = this.#css): string {
    if (css.length > 0)
      return css.reduce((prev, curr) => {
        if (typeof curr !== 'string' && 'style' in curr) {
          const entries: [string, unknown][] = Object.entries(
            typeof curr.style === 'function'
              ? curr.style({ ...this.#data }, { ...this.#props })
              : curr.style
          )
          const style: string = `{${entries
            .map(([key, value]) => {
              key = this.#toKebabCase(key)
              if (key.startsWith('webkit')) key = `-${key}`

              return `${key}: ${value};`
            })
            .join('\n')}}`

          return `${prev} :host ${curr.selector ?? ''}${style}`
        }

        return `${prev}${curr}`
      }, '') as string

    return ''
  }

  #bind(): string {
    return ` $bind="${this.#name}-bind-${this.#generator.next().value}" `
  }

  #getHtml(): Sanitized<D, P> {
    return (
      typeof this.#html === 'function'
        ? this.#html({ data: { ...this.#data }, bind: ()=> this.#bind() }, { ...this.#props })
        : this.#html
    )[symbol]
  }

  #getClassName(): string | undefined {
    return typeof this.#className === 'function'
      ? this.#className({ ...this.#data }, { ...this.#props })
      : this.#className
  }

  #renderOnServer(propsChain: PropsChain<P>): string {
    const tagName: string = this.#getTagName()

    if (this.#isOnlyCsr) return `<${tagName}></${tagName}>`

    this.#initProps(propsChain)

    return `
        <${tagName} class="${`${this.#name} ${this.#getClassName() ?? ''}`.trim()}">
          <template shadowrootmode="open">
            ${this.#css.length > 0 ? `<style>${this.#getStyle()}</style>` : ''}
            ${this.#getHtml().reduce(
              (prev, curr) =>
                prev +
                (curr instanceof FiCsElement ? curr.#renderOnServer(this.#propsChain) : curr),
              ''
            )}
          </template>
        </${tagName}>
      `.trim()
  }

  #addClassName(fics: HTMLElement, isRerendering?: boolean): void {
    if (isRerendering) fics.classList.remove(...Array.from(fics.classList))
    else this.#dataBindings.className = typeof this.#className === 'function'

    this.#className
      ? fics.setAttribute('class', `${this.#name} ${this.#getClassName()}`)
      : fics.classList.add(this.#name)
  }

  #addHtml(shadowRoot: ShadowRoot): void {
    const ficsElements: FiCsElement<D, P>[] = new Array()
    const tagName: string = 'f-var'
    const fragment: DocumentFragment = document.createRange().createContextualFragment(
      this.#getHtml().reduce((prev, curr) => {
        if (curr instanceof FiCsElement) ficsElements.push(curr)

        return prev + (curr instanceof FiCsElement ? `<${tagName}></${tagName}>` : curr)
      }, '') as string
    )
    const attr: string = `${this.#name}-bind-${this.#generator.next().value}`

    if (this.#dom.childNodes.length > 0) {
    } else {
      for (const element of Array.from(fragment.querySelectorAll('[fics-bind]'))) {
        element.removeAttribute('fics-bind')
        element.setAttribute(attr, '')
      }

      this.#dom = fragment
      this.#dataBindings.html = typeof this.#html === 'function'
    }

    for (const node of Array.from(this.#dom.childNodes)) {
      shadowRoot.appendChild(node)
      if (node instanceof HTMLElement) {
        if (node.localName === tagName) {
          const fics: FiCsElement<D, P> | undefined = ficsElements.shift()
          if (fics) node.replaceWith(fics.#component ?? fics.#render(this.#propsChain))
        } else
          for (const element of Array.from(node.querySelectorAll(tagName)) as HTMLElement[]) {
            const fics: FiCsElement<D, P> | undefined = ficsElements.shift()
            if (fics) element.replaceWith(fics.#component ?? fics.#render(this.#propsChain))
          }
      }
    }
  }

  #addCss(shadowRoot: ShadowRoot, css: Css<D, P> = new Array()): void {
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

  #getShadowRoot(fics: HTMLElement): ShadowRoot {
    if (fics.shadowRoot) return fics.shadowRoot

    throw new Error(`${this.#name} does not have shadowRoot...`)
  }

  #addEvent(fics: HTMLElement, action: Action<D, P>, isRerendering?: boolean): void {
    const { handler, selector, method } = action

    if (selector) {
      const shadowRoot: ShadowRoot = this.#getShadowRoot(fics)
      const getSelectors = (selector: string): Element[] =>
        Array.from(shadowRoot.querySelectorAll(`:host ${selector}`))
      const elements: Element[] = new Array()

      if (/^.+(\.|#).+$/.test(selector)) {
        const prefix = selector.startsWith('.') ? '.' : '#'
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
                event
              },
              { ...this.#props }
            )

          if (isRerendering)
            element.removeEventListener(handler, (event: Event) => methodFunc(event))

          if (shadowRoot.activeElement !== element)
            element.addEventListener(handler, (event: Event) => methodFunc(event))
        }
      else
        console.error(`:host ${selector} does not exist or is not applicable in ${this.#name}...`)
    }
  }

  #addActions(fics: HTMLElement): void {
    if (this.#actions.length > 0)
      this.#actions.forEach((event, index) => {
        const { handler, selector, method } = event

        if (selector) {
          this.#dataBindings.actions.push(index)
          this.#addEvent(fics, event)
        } else
          fics.addEventListener(handler, (event: Event) =>
            method(
              {
                data: { ...this.#data },
                setData: (key: keyof D, value: D[typeof key]) => this.setData(key, value),
                event
              },
              { ...this.#props }
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

    const fics = this.#component ?? document.createElement(tagName)

    this.#initProps(propsChain)
    this.#addClassName(fics)
    this.#addHtml(this.#getShadowRoot(fics))
    this.#addCss(this.#getShadowRoot(fics))
    this.#addActions(fics)

    if (!this.#component) this.#component = fics

    return fics
  }

  #reRender(): void {
    const fics: HTMLElement | undefined = this.#component

    if (fics) {
      const { className, html, css, actions } = this.#dataBindings
      const shadowRoot: ShadowRoot = this.#getShadowRoot(fics)

      if (className) this.#addClassName(fics, true)

      if (html) this.#addHtml(shadowRoot)

      if (css.length > 0)
        this.#addCss(
          shadowRoot,
          css.map(index => this.#css[index])
        )

      if (actions.length > 0)
        for (const index of actions) {
          const { selector } = this.#actions[index]

          if (selector) this.#addEvent(fics, this.#actions[index], true)
        }
    }
  }

  getData<K extends keyof D>(key: K): D[typeof key] {
    if (key in this.#data) return this.#data[key]

    throw new Error(`${key as string} is not defined in data...`)
  }

  setData(key: keyof D, value: D[typeof key]): void {
    if (this.#isReflecting) throw new Error(`${key as string} is not changed in reflections...`)
    else if (!(key in this.#data)) throw new Error(`${key as string} is not defined in data...`)
    else if (this.#data[key] !== value) {
      this.#data[key] = value
      addQueue({ ficsId: this.#ficsId, reRender: this.#reRender() })

      this.#propsTrees.find(tree => tree.dataKey === key)?.setProps(value as unknown as P[keyof P])

      if (this.#reflections && key in this.#reflections) {
        this.#isReflecting = true
        this.#reflections[key](this.#data[key])
        this.#isReflecting = false
      }
    }
  }

  ssr(): string {
    return this.#renderOnServer(this.#propsChain)
  }

  define(suffix?: string): void {
    const tagName: string = this.#getTagName() + (suffix ? `-${this.#toKebabCase(suffix)}` : '')

    if (customElements.get(tagName)) throw new Error(`${tagName} is already defined...`)
    else {
      const that = this

      customElements.define(
        tagName,
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot
          #isRendered: boolean = false

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }

          connectedCallback(): void {
            if (!this.#isRendered && this.shadowRoot.innerHTML.trim() === '') {
              that.#initProps(that.#propsChain)
              that.#addClassName(this)
              that.#addHtml(that.#getShadowRoot(this))
              that.#addCss(that.#getShadowRoot(this))
              that.#addActions(this)

              that.#component = this
              this.#isRendered = true
            }
          }
        }
      )
    }
  }
}
