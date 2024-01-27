import generate from './generator'
import addQueue from './queue'
import {
  Action,
  ClassName,
  Css,
  FiCs,
  Html,
  Inheritances,
  PropsChain,
  Reflections,
  Sanitized
} from './types'

const symbol: symbol = Symbol('sanitized')
const generator: Generator<number> = generate()

export default class FiCsElement<D extends object, P extends object> {
  readonly #reservedNames: Record<string, boolean> = { var: true }
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
  readonly #attr: string = 'data-fics-bind'

  #propsChain: PropsChain<P> = new Map()
  #generator: Generator<number> = generate()
  #component: HTMLElement | undefined = undefined
  #isReflecting: boolean = false

  constructor({
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

      if (inheritances && inheritances.length > 0) this.#inheritances = [...inheritances]

      this.#props = { ...props } as P

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

  #sanitize(templates: TemplateStringsArray, ...variables: any[]): Record<symbol, Sanitized<D, P>> {
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
        variable =
          typeof variable === 'string' && variable !== ''
            ? (variable as string).replaceAll(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
            : variable ?? ''

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

  #bind(): string {
    return ` ${this.#attr}="${this.#name}-${this.#generator.next().value}"`
  }

  #getHtml(isRerendering?: boolean): Sanitized<D, P> {
    if (isRerendering) this.#generator = generate()

    return (
      typeof this.#html === 'function'
        ? this.#html({
            data: { ...this.#data },
            props: { ...this.#props },
            html: this.#sanitize,
            bind: () => this.#bind()
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

        return prev + (curr instanceof FiCsElement ? `<${tagName}></${tagName}>` : curr)
      }, '') as string
    )
    const appendDescendant = (descendant: HTMLElement): void => {
      const replaceWith = (element: Element): void => {
        const fics: FiCsElement<D, P> | undefined = ficsElements.shift()
        if (fics) element.replaceWith(fics.#component ?? fics.#render(this.#propsChain))
      }

      if (descendant.localName === tagName) replaceWith(descendant)
      else
        for (const element of Array.from(descendant.querySelectorAll(tagName))) replaceWith(element)
    }

    if (isRerendering) {
      const binds: Element[] = Array.from(shadowRoot.querySelectorAll(`[${this.#attr}]`)).reverse()
      const bindMap: Map<string | null, HTMLElement> = new Map()
      const renewElement = (element: Element, newElement: HTMLElement | null | undefined): void => {
        if (newElement) {
          for (let i = 0; i < element.attributes.length; i++) {
            const { name }: { name: string } = element.attributes[i]
            const attr: Attr | null = newElement.attributes.getNamedItem(name)

            if (attr) element.setAttribute(name, attr.value)
            else element.removeAttribute(name)
          }

          for (let i = 0; i < newElement.attributes.length; i++) {
            const { name, value }: { name: string; value: string } = newElement.attributes[i]

            if (element.attributes.getNamedItem(name)) continue
            element.setAttribute(name, value)
          }

          if (element.querySelectorAll(`[${this.#attr}]`).length === 0 && 'textContent' in element)
            element.textContent = newElement.textContent
        }
      }

      for (const bind of binds) {
        const attr: string | null = bind.getAttribute(this.#attr)
        const newElement: HTMLElement | null = fragment.querySelector(`[${this.#attr}="${attr}"]`)

        if (attr && !bindMap.get(attr) && newElement) {
          renewElement(bind, newElement)

          const prevSiblings: ChildNode[][] = [[]]
          const nextSiblings: ChildNode[] = []
          let prevSibling: ChildNode | null = newElement.previousSibling
          let nextSibling: ChildNode | null = newElement.nextSibling
          let current: number = 0

          while (prevSibling) {
            if (prevSibling instanceof HTMLElement && prevSibling.hasAttribute(this.#attr)) {
              bindMap.set(prevSibling.getAttribute(this.#attr), prevSibling)
              prevSiblings.push([])
              current++
            } else if (
              !(prevSibling.nodeName === '#text' && prevSibling.textContent?.trim() === '')
            )
              prevSiblings[current].push(prevSibling)

            prevSibling = prevSibling.previousSibling

            if (!prevSibling) current = 0
          }
          while (nextSibling) {
            if (!(nextSibling.nodeName === '#text' && nextSibling.textContent?.trim() === ''))
              nextSiblings.unshift(nextSibling)

            nextSibling = nextSibling.nextSibling
          }

          prevSibling = bind.previousSibling
          nextSibling = bind.nextSibling

          let element: HTMLElement | undefined = undefined

          while (prevSibling) {
            const temporary: ChildNode | null = prevSibling.previousSibling
            const insert = (): void => {
              for (const childNode of prevSiblings[current]) (element ?? bind).before(childNode)
            }

            if (
              prevSibling instanceof HTMLElement &&
              bindMap.get(prevSibling.getAttribute(this.#attr))
            ) {
              renewElement(prevSibling, bindMap.get(prevSibling.getAttribute(this.#attr)))
              current++
              insert()
              element = prevSibling
            } else prevSibling.remove()

            prevSibling = temporary

            if (!prevSibling) insert()
          }
          while (nextSibling) {
            const temporary: ChildNode | null = nextSibling.nextSibling
            nextSibling.remove()
            nextSibling = temporary

            if (!nextSibling) for (const childNode of nextSiblings) bind.after(childNode)
          }
        }
      }

      for (const childNode of Array.from(shadowRoot.childNodes)) {
        if (childNode instanceof HTMLElement) appendDescendant(childNode)
      }
    } else {
      this.#bindings.html = typeof this.#html === 'function'

      for (const childNode of Array.from(fragment.childNodes)) {
        shadowRoot.append(childNode)
        if (childNode instanceof HTMLElement) appendDescendant(childNode)
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
          if (isRerendering && element.hasAttribute(this.#attr)) continue

          element.addEventListener(handler, (event: Event) =>
            method({
              data: { ...this.#data },
              props: { ...this.#props },
              setData: (key: keyof D, value: D[typeof key]): void => this.setData(key, value),
              event
            })
          )
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
          this.#bindings.actions.push(index)
          this.#addEvent(fics, event)
        } else
          fics.addEventListener(handler, (event: Event) =>
            method({
              data: { ...this.#data },
              props: { ...this.#props },
              setData: (key: keyof D, value: D[typeof key]): void => this.setData(key, value),
              event
            })
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
