import generate from './generator'
import addQueue from './queue'
import {
  Action,
  ClassName,
  Css,
  FiCs,
  Html,
  Inheritances,
  Method,
  PropsChain,
  Reflections,
  Sanitized,
  Style
} from './types'

const symbol: symbol = Symbol('sanitized')
const generator: Generator<number> = generate()

export default class FiCsElement<D extends object, P extends object> {
  readonly #reservedWords: Record<string, boolean> = { var: true }
  readonly #ficsId: string
  readonly #name: string
  readonly #tagName: string
  readonly #isImmutable: boolean = false
  readonly #data: D = {} as D
  readonly #reflections: Reflections<D> | undefined = undefined
  readonly #inheritances: Inheritances<D> = new Array()
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
  readonly #bindings: { className: boolean; html: boolean; css: number[]; actions: number[] } = {
    className: false,
    html: false,
    css: new Array(),
    actions: new Array()
  }

  #propsChain: PropsChain<P> = new Map()
  #component: HTMLElement | undefined = undefined
  #isReflecting: boolean = false

  constructor({
    ficsId,
    name,
    isImmutable,
    data,
    reflections,
    inheritances,
    props,
    isOnlyCsr,
    className,
    html,
    css,
    actions
  }: FiCs<D, P>) {
    if (this.#reservedWords[this.#toKebabCase(name)])
      throw new Error(`${name} is a reserved word in FiCsJS...`)
    else {
      this.#ficsId = ficsId ?? `fics${generator.next().value}`
      this.#name = this.#toKebabCase(name)
      this.#tagName = `f-${this.#name}`

      if (isImmutable) this.#isImmutable = isImmutable

      if (data) {
        if (this.#isImmutable)
          throw new Error(`${this.#tagName} is an immutable component, so it cannot define data...`)
        else {
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
      }

      if (inheritances && inheritances.length > 0) this.#inheritances = [...inheritances]

      if (!this.#isImmutable && props) this.#props = { ...props } as P

      if (isOnlyCsr) this.#isOnlyCsr = true
      if (className) this.#className = className

      this.#html = typeof html === 'function' ? html : { ...html }

      if (css && css.length > 0) this.#css = [...css]
      if (actions && actions.length > 0) this.#actions = [...actions]
    }
  }

  #toKebabCase = (str: string): string => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

  #setProps = (key: keyof P, value: P[typeof key]): void => {
    if (!(key in this.#props)) throw new Error(`${key as string} is not defined in props...`)
    else if (this.#props[key] !== value) {
      this.#props[key] = value
      addQueue({ ficsId: this.#ficsId, reRender: this.#reRender() })
    }
  }

  #initProps = (propsChain: PropsChain<P>): void => {
    if (this.#inheritances.length > 0)
      for (const { descendants, values } of this.#inheritances)
        for (const descendant of Array.isArray(descendants) ? descendants : [descendants]) {
          if (descendant.#isImmutable)
            throw new Error(
              `${this.#tagName} is an immutable component, so it cannot receive props...`
            )
          else {
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

              if (key in chain && propsChain.has(descendantId)) continue

              propsChain.set(descendantId, { ...chain, [key]: value })

              const propsKey = key as keyof P

              this.#propsTrees.push({
                descendantId,
                dataKey,
                propsKey,
                setProps: (value: P[keyof P]) => descendant.#setProps(propsKey, value)
              })
            }
          }
        }

    this.#propsChain = new Map(propsChain)

    for (const [key, value] of Object.entries(this.#propsChain.get(this.#ficsId) ?? {}))
      this.#props[key as keyof P] = value as P[keyof P]
  }

  #setDataProps = (): { data: D; props: P } =>
    this.#isImmutable
      ? { data: {} as D, props: {} as P }
      : { data: { ...this.#data }, props: { ...this.#props } }

  #getStyle = (css: Css<D, P> = this.#css): string => {
    if (css.length > 0)
      return css.reduce((prev, curr) => {
        if (typeof curr !== 'string' && 'style' in curr) {
          const { style, selector }: Style<D, P> = curr
          const entries: [string, unknown][] = Object.entries(
            typeof style === 'function' ? style(this.#setDataProps()) : style
          )
          const styleContent: string = `{${entries
            .map(([key, value]) => {
              key = this.#toKebabCase(key)
              if (key.startsWith('webkit')) key = `-${key}`

              return `${key}: ${value};`
            })
            .join('\n')}}`

          return `${prev} :host ${selector ?? ''}${styleContent}`
        }

        return `${prev}${curr}`
      }, '') as string

    return ''
  }

  #sanitize = (
    isIgnored: boolean,
    templates: TemplateStringsArray,
    ...variables: unknown[]
  ): Record<symbol, Sanitized<D, P>> => {
    let result: (Sanitized<D, P> | unknown)[] = new Array()

    for (let [index, template] of templates.entries()) {
      template = template.trim()
      let variable: any = variables[index]

      if (variable && typeof variable === 'object' && symbol in variable) {
        if (typeof variable[symbol][0] === 'string')
          variable[symbol][0] = template + variable[symbol][0]
        else variable[symbol].unshift(template)

        result = [...result, ...variable[symbol]]
      } else {
        if (isIgnored && typeof variable === 'string')
          variable = variable.replaceAll(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
        else if (variable === undefined) variable = ''

        if (index === 0 && template === '') result.push(variable)
        else {
          const length: number = result.length - 1
          const last: Sanitized<D, P> | unknown = result[length] ?? ''
          const isFiCsElement: boolean = variable instanceof FiCsElement

          if (last instanceof FiCsElement)
            isFiCsElement ? result.push(template, variable) : result.push(`${template}${variable}`)
          else {
            result.splice(length, 1, `${last}${template}${isFiCsElement ? '' : variable}`)

            if (isFiCsElement) result.push(variable)
          }
        }
      }
    }

    return { [symbol]: result as Sanitized<D, P> }
  }

  #getHtml = (): Sanitized<D, P> =>
    (typeof this.#html === 'function'
      ? this.#html({
          ...this.#setDataProps(),
          template: (templates: TemplateStringsArray, ...variables: unknown[]) =>
            this.#sanitize(true, templates, ...variables),
          html: (templates: TemplateStringsArray, ...variables: unknown[]) =>
            this.#sanitize(false, templates, variables)[symbol]
        })
      : this.#html)[symbol]

  #getClassName = (): string | undefined =>
    typeof this.#className === 'function' ? this.#className(this.#setDataProps()) : this.#className

  #renderOnServer = (propsChain: PropsChain<P>): string => {
    if (this.#isOnlyCsr) return `<${this.#tagName}></${this.#tagName}>`

    this.#initProps(propsChain)

    return `
        <${this.#tagName} class="${`${this.#name} ${this.#getClassName() ?? ''}`.trim()}">
          <template shadowrootmode="open">
            ${this.#css.length > 0 ? `<style>${this.#getStyle()}</style>` : ''}
            ${this.#getHtml().reduce(
              (prev, curr) =>
                `${prev}${
                  curr instanceof FiCsElement ? curr.#renderOnServer(this.#propsChain) : curr
                }`,
              ''
            )}
          </template>
        </${this.#tagName}>
      `.trim()
  }

  #addClassName = (fics: HTMLElement, isRerendering?: boolean): void => {
    isRerendering
      ? fics.classList.remove(...Array.from(fics.classList))
      : (this.#bindings.className = typeof this.#className === 'function')

    this.#className
      ? fics.setAttribute('class', `${this.#name} ${this.#getClassName()}`)
      : fics.classList.add(this.#name)
  }

  #addHtml(shadowRoot: ShadowRoot, isRerendering?: boolean): void {
    const children: FiCsElement<D, P>[] = new Array()
    const tag: string = 'f-var'
    const fragment: DocumentFragment = document.createRange().createContextualFragment(
      this.#getHtml().reduce((prev, curr) => {
        if (curr instanceof FiCsElement) children.push(curr)

        return `${prev}${
          curr instanceof FiCsElement
            ? `<${tag} data-fics-id="${curr.#ficsId}" data-fics-name="${curr.#tagName}"></${tag}>`
            : curr
        }`
      }, '') as string
    )

    if (isRerendering) {
    } else {
      this.#bindings.html = typeof this.#html === 'function'

      const replace = (element: Element): void => {
        const child: FiCsElement<D, P> | undefined = children.shift()

        if (child)
          element.replaceWith(
            child.#isImmutable && child.#component
              ? child.#component
              : child.#render(this.#propsChain)
          )
      }

      for (const childNode of Array.from(fragment.childNodes)) {
        shadowRoot.append(childNode)

        if (childNode instanceof HTMLElement) {
          if (childNode.localName === tag) replace(childNode)
          else for (const element of Array.from(childNode.querySelectorAll(tag))) replace(element)
        }
      }
    }
  }

  #addCss = (shadowRoot: ShadowRoot, css: Css<D, P> = new Array()): void => {
    if (this.#css.length > 0) {
      if (css.length === 0)
        for (const [index, content] of this.#css.entries()) {
          if (
            typeof content !== 'string' &&
            'style' in content &&
            typeof content.style === 'function'
          )
            this.#bindings.css.push(index)

          continue
        }

      const stylesheet: CSSStyleSheet = new CSSStyleSheet()
      const style: Css<D, P> | undefined =
        css.length > 0 ? Array.from(new Set([...this.#css, ...css])) : undefined

      shadowRoot.adoptedStyleSheets = [stylesheet]
      stylesheet.replaceSync(this.#getStyle(style))
    }
  }

  #getShadowRoot = (fics: HTMLElement): ShadowRoot => {
    if (fics.shadowRoot) return fics.shadowRoot

    throw new Error(`${this.#name} does not have shadowRoot...`)
  }

  #addMethod = (element: Element, handler: string, method: Method<D, P>): void =>
    element.addEventListener(handler, (event: Event) =>
      method({
        ...this.#setDataProps(),
        setData: (key: keyof D, value: D[typeof key]): void => this.setData(key, value),
        event
      })
    )

  #addEvent = (fics: HTMLElement, action: Action<D, P>, isRerendering?: boolean): void => {
    const { selector }: Action<D, P> = action

    if (selector) {
      const elements: Element[] = Array.from(
        this.#getShadowRoot(fics).querySelectorAll(`:host ${selector.trim()}`)
      )

      if (elements.length > 0) {
        const { handler, method }: Action<D, P> = action
        for (const element of elements) {
          if (isRerendering) continue
          this.#addMethod(element, handler, method)
        }
      }
    }
  }

  #addActions = (fics: HTMLElement): void => {
    if (this.#actions.length > 0)
      this.#actions.forEach((event, index) => {
        const { handler, selector, method }: Action<D, P> = event

        if (selector) {
          this.#bindings.actions.push(index)
          this.#addEvent(fics, event)
        } else this.#addMethod(fics, handler, method)
      })
  }

  #render = (propsChain: PropsChain<P>): HTMLElement => {
    if (!customElements.get(this.#tagName))
      customElements.define(
        this.#tagName,
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }
        }
      )

    const fics = document.createElement(this.#tagName)

    this.#initProps(propsChain)
    this.#addClassName(fics)
    this.#addHtml(this.#getShadowRoot(fics))
    this.#addCss(this.#getShadowRoot(fics))
    this.#addActions(fics)

    if (!this.#component) this.#component = fics

    return fics
  }

  #reRender = (): void => {
    const fics: HTMLElement | undefined = this.#component

    if (fics) {
      if (this.#bindings.className) this.#addClassName(fics, true)

      if (this.#bindings.html) this.#addHtml(this.#getShadowRoot(fics), true)

      if (this.#bindings.css.length > 0)
        this.#addCss(
          this.#getShadowRoot(fics),
          this.#bindings.css.map(index => this.#css[index])
        )

      if (this.#bindings.actions.length > 0)
        for (const index of this.#bindings.actions) this.#addEvent(fics, this.#actions[index], true)
    }
  }

  getData = <K extends keyof D>(key: K): D[typeof key] => {
    if (key in this.#data) return this.#data[key]

    throw new Error(`${key as string} is not defined in data...`)
  }

  setData = (key: keyof D, value: D[typeof key]): void => {
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

  ssr = (): string => this.#renderOnServer(this.#propsChain)

  define = (): void => {
    if (!customElements.get(this.#tagName)) {
      const that: FiCsElement<D, P> = this

      customElements.define(
        that.#tagName,
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
