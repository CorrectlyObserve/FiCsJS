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
  Sanitized
} from './types'

const symbol: symbol = Symbol('sanitized')
const generator: Generator<number> = generate()

export default class FiCsElement<D extends object, P extends object> {
  readonly #reservedWords: Record<string, boolean> = { var: true }
  readonly #ficsId: string
  readonly #name: string
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
  readonly #sanitization: Map<string, boolean> = new Map([['', true]])
  readonly #attr: string = 'data-fics-bind'

  #propsChain: PropsChain<P> = new Map()
  #generator: Generator<number> = generate()
  #attrs: Record<string, boolean> = {}
  #component: HTMLElement | undefined = undefined
  #isReflecting: boolean = false

  constructor({
    ficsId,
    name,
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

      if (inheritances && inheritances.length > 0) this.#inheritances = [...inheritances]

      this.#props = { ...props } as P

      if (isOnlyCsr) this.#isOnlyCsr = true
      if (className) this.#className = className

      this.#html = typeof html === 'function' ? html : { ...html }

      if (css && css.length > 0) this.#css = [...css]
      if (actions && actions.length > 0) this.#actions = [...actions]
    }
  }

  #toKebabCase = (str: string): string => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

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
              ? curr.style({ data: { ...this.#data }, props: { ...this.#props } })
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

  #avoidSanitization(key: string): string {
    this.#sanitization.set(key, true)
    return key
  }

  #sanitize(
    templates: TemplateStringsArray,
    ...variables: unknown[]
  ): Record<symbol, Sanitized<D, P>> {
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
        if (typeof variable === 'string' && !this.#sanitization.get(variable)) {
          variable = variable.replaceAll(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
        } else if (variable === undefined) variable = ''

        if (index === 0 && template === '') result.push(variable)
        else {
          const last: Sanitized<D, P> | unknown = result[result.length - 1] ?? ''
          const isFiCsElement: boolean = variable instanceof FiCsElement

          if (last instanceof FiCsElement)
            isFiCsElement ? result.push(template, variable) : result.push(`${template}${variable}`)
          else {
            result.splice(
              result.length - 1,
              1,
              `${last}${template}${isFiCsElement ? '' : variable}`
            )

            if (isFiCsElement) result.push(variable)
          }
        }
      }
    }

    return { [symbol]: result as Sanitized<D, P> }
  }

  #bind(id?: string, index?: number): string {
    id = id ? this.#toKebabCase(id) : this.#generator.next().value
    return ` ${this.#attr}="${this.#name}-${id}${typeof index === 'number' ? `-${index}` : ''}"`
  }

  #getHtml(isRerendering?: boolean): Sanitized<D, P> {
    if (isRerendering) this.#generator = generate()

    return (
      typeof this.#html === 'function'
        ? this.#html({
            data: { ...this.#data },
            props: { ...this.#props },
            template: (templates: TemplateStringsArray, ...variables: unknown[]) =>
              this.#sanitize(templates, ...variables),
            bind: (id?: string, index?: number) => this.#bind(id, index),
            html: (content: string) => this.#avoidSanitization(content)
          })
        : this.#html
    )[symbol]
  }

  #getClassName(): string | undefined {
    return typeof this.#className === 'function'
      ? this.#className({ data: { ...this.#data }, props: { ...this.#props } })
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
                `${prev}${
                  curr instanceof FiCsElement ? curr.#renderOnServer(this.#propsChain) : curr
                }`,
              ''
            )}
          </template>
        </${tagName}>
      `.trim()
  }

  #addClassName(fics: HTMLElement, isRerendering?: boolean): void {
    if (isRerendering) fics.classList.remove(...Array.from(fics.classList))
    else this.#bindings.className = typeof this.#className === 'function'

    this.#className
      ? fics.setAttribute('class', `${this.#name} ${this.#getClassName()}`)
      : fics.classList.add(this.#name)
  }

  #addHtml(shadowRoot: ShadowRoot, isRerendering?: boolean): void {
    const ficsElements: FiCsElement<D, P>[] = new Array()
    const tagName: string = 'f-var'
    const fragment: DocumentFragment = document.createRange().createContextualFragment(
      this.#getHtml(isRerendering).reduce((prev, curr) => {
        if (curr instanceof FiCsElement) ficsElements.push(curr)

        return `${prev}${curr instanceof FiCsElement ? `<${tagName}></${tagName}>` : curr}`
      }, '') as string
    )
    const getChildNodes = (parent: ShadowRoot | DocumentFragment | Element): ChildNode[] =>
      Array.from(parent.childNodes)

    const active: Element | null = shadowRoot.activeElement
    const getAttr = (element: Element): string | null => element.getAttribute(this.#attr)
    const activeAttr: string | null = active ? getAttr(active) : null
    const findByAttr = (
      ancestor: DocumentFragment | ShadowRoot,
      attr: string | null
    ): HTMLElement | null => ancestor.querySelector(`[${this.#attr}="${attr}"]`)

    if (isRerendering) {
      const getBounds = (ancestor: ShadowRoot | HTMLElement): Element[] =>
        Array.from(ancestor.querySelectorAll(`[${this.#attr}]`))

      for (const bound of getBounds(shadowRoot).reverse()) {
        const attr: string | null = getAttr(bound)
        if (!attr) continue

        this.#attrs[attr] = true

        const newElement: HTMLElement | null = findByAttr(fragment, attr)
        if (!newElement) continue

        if (bound.localName !== newElement.localName && attr === getAttr(newElement))
          throw new Error(
            `The Elements have ${attr} as an attribute are different before and after re-rendering...`
          )
        else {
          const getAttrs = (bound: Element): Attr[] => Array.from(bound.attributes)
          const attrs: Attr[] = getAttrs(bound)
          const attrNames: Set<string> = new Set(attrs.map(({ name }) => name))
          const oldAttrs: Record<string, string> = {}
          const newAttrs: Record<string, string> = {}

          for (const { name, value } of attrs) oldAttrs[name] = value

          for (const { name, value } of getAttrs(newElement))
            if (attrNames.has(name))
              oldAttrs[name] === value ? delete oldAttrs[name] : (newAttrs[name] = value)
            else bound.removeAttribute(name)

          const newAttrKeys: string[] = Object.keys(newAttrs)

          if (Object.keys(oldAttrs).length > 0 && newAttrKeys.length > 0)
            for (const key of newAttrKeys) bound.setAttribute(key, newAttrs[key])

          for (const childNode of getChildNodes(bound)) childNode.remove()

          for (const childNode of getChildNodes(newElement) as Element[])
            bound.append(getBounds(newElement).length > 0 ? childNode : childNode.cloneNode(true))

          newElement.replaceWith(bound)
        }
      }

      for (const childNode of getChildNodes(shadowRoot)) childNode.remove()
    } else this.#bindings.html = typeof this.#html === 'function'

    const replace = (element: Element): void => {
      const fics: FiCsElement<D, P> | undefined = ficsElements.shift()
      if (fics) element.replaceWith(fics.#component ?? fics.#render(this.#propsChain))
    }

    for (const childNode of getChildNodes(fragment)) {
      shadowRoot.append(childNode)

      if (childNode instanceof HTMLElement) {
        if (
          !isRerendering &&
          ((childNode.localName === 'iframe' && childNode.hasAttribute(this.#attr)) ||
            childNode.querySelector(`iframe[${this.#attr}]`))
        )
          console.warn(
            `The iframe elements in ${this.#getTagName()} component are re-created in re-rendering...`
          )

        if (childNode.localName === tagName) replace(childNode)
        else for (const element of Array.from(childNode.querySelectorAll(tagName))) replace(element)
      }
    }

    if (isRerendering && activeAttr) findByAttr(shadowRoot, activeAttr)?.focus()
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

  #getShadowRoot(fics: HTMLElement): ShadowRoot {
    if (fics.shadowRoot) return fics.shadowRoot

    throw new Error(`${this.#name} does not have shadowRoot...`)
  }

  #addMethod = (element: Element, handler: string, method: Method<D, P>): void =>
    element.addEventListener(handler, (event: Event) =>
      method({
        data: { ...this.#data },
        props: { ...this.#props },
        setData: (key: keyof D, value: D[typeof key]): void => this.setData(key, value),
        event
      })
    )

  #addEvent(fics: HTMLElement, action: Action<D, P>, isRerendering?: boolean): void {
    const { selector }: Action<D, P> = action

    if (selector) {
      const elements: Element[] = Array.from(
        this.#getShadowRoot(fics).querySelectorAll(`:host ${selector.trim()}`)
      )

      if (elements.length > 0) {
        const { handler, method }: Action<D, P> = action
        for (const element of elements) {
          const attr: string | null = element.getAttribute(this.#attr)

          if (isRerendering && attr && this.#attrs[attr]) continue
          this.#addMethod(element, handler, method)
        }
      }
    }
  }

  #addActions(fics: HTMLElement): void {
    if (this.#actions.length > 0)
      this.#actions.forEach((event, index) => {
        const { handler, selector, method }: Action<D, P> = event

        if (selector) {
          this.#bindings.actions.push(index)
          this.#addEvent(fics, event)
        } else this.#addMethod(fics, handler, method)
      })
  }

  #render(propsChain: PropsChain<P>): HTMLElement {
    const that = new FiCsElement({
      ficsId: this.#ficsId,
      name: this.#name,
      data: () => this.#data,
      reflections: { ...(this.#reflections ?? ({} as Reflections<D>)) },
      inheritances: [...this.#inheritances],
      props: { ...(this.#props ?? {}) },
      isOnlyCsr: this.#isOnlyCsr,
      className: this.#className,
      html: this.#html,
      css: [...this.#css],
      actions: [...this.#actions]
    })
    const tagName: string = that.#getTagName()

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

    const fics = that.#component ?? document.createElement(tagName)

    that.#initProps(propsChain)
    that.#addClassName(fics)
    that.#addHtml(this.#getShadowRoot(fics))
    that.#addCss(this.#getShadowRoot(fics))
    that.#addActions(fics)

    if (!that.#component) that.#component = fics

    return that.#component
  }

  #reRender(): void {
    const fics: HTMLElement | undefined = this.#component

    if (fics) {
      if (this.#bindings.className) this.#addClassName(fics, true)

      if (this.#bindings.html) {
        this.#sanitization.clear()
        this.#addHtml(this.#getShadowRoot(fics), true)
      }

      if (this.#bindings.css.length > 0)
        this.#addCss(
          this.#getShadowRoot(fics),
          this.#bindings.css.map(index => this.#css[index])
        )

      if (this.#bindings.actions.length > 0) {
        for (const index of this.#bindings.actions) this.#addEvent(fics, this.#actions[index], true)
        this.#attrs = {}
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
