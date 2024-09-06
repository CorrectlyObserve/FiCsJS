import generate from './generator'
import addToQueue from './queue'
import type {
  Action,
  Attrs,
  Bindings,
  ClassName,
  Css,
  DataProps,
  FiCs,
  Html,
  HtmlContent,
  Hooks,
  Inheritances,
  I18n,
  Method,
  Param,
  PropsChain,
  PropsTree,
  Reflections,
  Sanitize,
  Sanitized,
  Style
} from './types'

const generator: Generator<number> = generate()

export default class FiCsElement<D extends object, P extends object> {
  readonly #name: string
  readonly #reservedWords: Record<string, true> = { var: true, router: true, link: true }
  readonly #ficsIdName: string = 'fics-id'
  readonly #ficsId: string
  readonly #tagName: string
  readonly #isImmutable: boolean = false
  readonly #data: D = {} as D
  readonly #reflections: Reflections<D> | undefined
  readonly #inheritances: Inheritances<D> = new Array()
  readonly #props: P = {} as P
  readonly #isOnlyCsr: boolean = false
  readonly #bindings: Bindings<D, P> = {
    isClassName: false,
    isAttr: false,
    css: new Array(),
    actions: new Array()
  }
  readonly #className: ClassName<D, P> | undefined
  readonly #attrs: Attrs<D, P> | undefined
  readonly #sanitized: symbol
  readonly #unsanitized: symbol
  readonly #html: Html<D, P>
  readonly #showAttr: string
  readonly #css: Css<D, P> = new Array()
  readonly #actions: Action<D, P>[] = new Array()
  readonly #hooks: Hooks<D, P> = {} as Hooks<D, P>
  readonly #propsTrees: PropsTree<D, P>[] = new Array()
  readonly #newElements: Set<Element> = new Set()
  readonly #components: Set<HTMLElement> = new Set()
  #propsChain: PropsChain<P> = new Map()
  #isReflecting: boolean = false

  constructor({
    name,
    isExceptional,
    isImmutable,
    data,
    reflections,
    inheritances,
    props,
    isOnlyCsr,
    className,
    attributes,
    html,
    css,
    actions,
    hooks
  }: FiCs<D, P>) {
    this.#name = this.#toKebabCase(name)

    if (!isExceptional && this.#reservedWords[this.#name])
      throw new Error(`"${name}" is a reserved word in FiCsJS...`)
    else {
      this.#ficsId = `${this.#ficsIdName}${generator.next().value}`
      this.#tagName = `f-${this.#name}`

      if (isImmutable) {
        if (data)
          throw new Error(
            `${this.#tagName} is the immutable component, so it cannot define data...`
          )

        if (props)
          throw new Error(
            `${this.#tagName} is the immutable component, so it cannot receive props...`
          )

        this.#isImmutable = isImmutable
      }

      if (data) {
        if (reflections) {
          for (const key of Object.keys(reflections))
            if (!(key in data())) throw new Error(`"${key}" is not defined in data...`)

          this.#reflections = { ...reflections }
        }

        for (const [key, value] of Object.entries(data())) this.#data[key as keyof D] = value
      }

      if (inheritances && inheritances.length > 0) this.#inheritances = [...inheritances]
      if (props) this.#props = { ...props } as P

      if (isOnlyCsr) this.#isOnlyCsr = true

      if (className) {
        if (!this.#isImmutable && typeof className === 'function') this.#bindings.isClassName = true
        this.#className = className
      }

      if (attributes) {
        if (!this.#isImmutable && typeof attributes === 'function') this.#bindings.isAttr = true
        this.#attrs = attributes
      }

      this.#sanitized = Symbol(`${this.#ficsId}-sanitized`)
      this.#unsanitized = Symbol(`${this.#ficsId}-unsanitized`)
      this.#html = html
      this.#showAttr = `${this.#ficsId}-show-syntax`

      if (css && css.length > 0) this.#css = [...css]
      if (actions && actions.length > 0) this.#actions = [...actions]
      if (hooks) this.#hooks = { ...hooks }
    }
  }

  #toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  #setProps(key: keyof P, value: P[typeof key]): void {
    if (!(key in this.#props)) throw new Error(`"${key as string}" is not defined in props...`)
    else if (this.#props[key] !== value) {
      this.#props[key] = value
      addToQueue({ ficsId: this.#ficsId, reRender: this.#reRender() })
    }
  }

  #initProps(propsChain: PropsChain<P>): void {
    if (this.#inheritances.length > 0)
      for (const { descendants, values } of this.#inheritances)
        for (const descendant of Array.isArray(descendants) ? descendants : [descendants]) {
          if (descendant.#isImmutable)
            throw new Error(
              `${this.#tagName} is an immutable component, so it cannot receive props...`
            )

          let dataKey: keyof D = '' as keyof D
          const data: [string, P][] = Object.entries(
            values({
              $getData: (key: keyof D) => {
                dataKey = key
                return this.getData(dataKey)
              }
            })
          )
          const descendantId: string = descendant.#ficsId

          for (const [key, value] of data) {
            const chain: Record<string, P> = propsChain.get(descendantId) ?? {}

            if (key in chain && propsChain.has(descendantId)) continue

            propsChain.set(descendantId, { ...chain, [key]: value })

            const last: number = this.#propsTrees.length - 1
            const tree: PropsTree<D, P> = {
              numberId: parseInt(descendantId.replace(new RegExp(`^${this.#ficsIdName}`), '')),
              dataKey,
              setProps: (value: P[keyof P]): void => descendant.#setProps(key, value)
            }
            const isLargerNumberId = (index: number): boolean =>
              this.#propsTrees[index].numberId >= tree.numberId

            if (last > 2) {
              let min: number = 0
              let max: number = last

              while (min <= max) {
                const mid: number = Math.floor((min + max) / 2)
                isLargerNumberId(mid) ? (min = mid + 1) : (max = mid - 1)
              }

              this.#propsTrees.splice(min, 0, tree)
            } else this.#propsTrees[last < 0 || isLargerNumberId(last) ? 'push' : 'unshift'](tree)
          }
        }

    this.#propsChain = new Map(propsChain)

    for (const [key, value] of Object.entries(this.#propsChain.get(this.#ficsId) ?? {}))
      this.#props[key as keyof P] = value as P[keyof P]
  }

  #setDataProps(): DataProps<D, P> {
    return this.#isImmutable
      ? { $data: {} as D, $props: {} as P }
      : { $data: { ...this.#data }, $props: { ...this.#props } }
  }

  #getClassName(): string {
    return typeof this.#className === 'function'
      ? this.#className(this.#setDataProps())
      : (this.#className ?? '')
  }

  #getAttrs(): [string, string][] {
    return Object.entries(
      typeof this.#attrs === 'function' ? this.#attrs(this.#setDataProps()) : (this.#attrs ?? [])
    )
  }

  #getStyle(css: Css<D, P>, host: string = ':host'): string {
    if (css.length === 0) return ''

    const createStyle = (param: Style<D, P>, host: string = ':host'): string => {
      const { style, selector } = param
      const entries: [string, unknown][] = Object.entries(
        typeof style === 'function' ? style(this.#setDataProps()) : style
      )
      const content: string = entries
        .map(([key, value]) => {
          key = this.#toKebabCase(key)
          if (key.startsWith('webkit')) key = `-${key}`

          return `${key}: ${value};`
        })
        .join('\n')

      return `${host} ${selector ?? ''}{${content}}`
    }

    return css.reduce((prev, curr) => {
      if (typeof curr !== 'string' && 'style' in curr) curr = ` ${createStyle(curr, host)}`

      return `${prev}${curr}`
    }, '') as string
  }

  #sanitize(
    templates: TemplateStringsArray,
    variables: (HtmlContent<D, P> | unknown)[]
  ): HtmlContent<D, P>[] {
    const isSymbol = (param: unknown, symbol: symbol): boolean =>
      !!(param && typeof param === 'object' && symbol in param)
    const sanitized: HtmlContent<D, P>[] = new Array()

    const sanitize = (index: number, template: string, variable: unknown) => {
      if (isSymbol(variable, this.#sanitized))
        sanitized.push(template, ...(variable as Sanitized<D, P>)[this.#sanitized])
      else if (Array.isArray(variable)) {
        sanitized.push(template)
        for (const child of variable) sanitize(index, '', child)
      } else if (isSymbol(variable, this.#unsanitized))
        sanitized.push(template, (variable as Record<symbol, string>)[this.#unsanitized])
      else {
        if (template !== '') sanitized.push(template)

        variable =
          typeof variable === 'string'
            ? variable.replaceAll(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
            : (variable ?? '')

        if (variable !== '') sanitized.push(variable as HtmlContent<D, P>)
      }
    }

    for (const [index, template] of templates.entries()) sanitize(index, template, variables[index])
    return sanitized as HtmlContent<D, P>[]
  }

  #getHtml(): HtmlContent<D, P>[] {
    const $template: Sanitize<D, P> = (
      templates: TemplateStringsArray,
      ...variables: (HtmlContent<D, P> | unknown)[]
    ): Sanitized<D, P> => ({ [this.#sanitized]: this.#sanitize(templates, variables) })

    const $i18n: ({ json, lang, keys }: I18n) => string = ({ json, lang, keys }: I18n): string => {
      let texts: Record<string, string> | string = json[lang]

      if (texts) {
        for (const key of Array.isArray(keys) ? keys : [keys])
          if (typeof texts === 'object' && texts !== null && key in texts) texts = texts[key]

        if (typeof texts === 'string') return texts

        throw new Error(`There is no applicable value in json..`)
      } else throw new Error(`${lang}.json does not exist...`)
    }

    return this.#html({
      ...this.#setDataProps(),
      $template,
      $html: (str: string): Record<symbol, string> => ({ [this.#unsanitized]: str }),
      $show: (condition: boolean): string => (condition ? '' : this.#showAttr),
      $i18n
    })[this.#sanitized]
  }

  #renderOnServer(propsChain: PropsChain<P>): string {
    if (this.#isOnlyCsr) return `<${this.#tagName}></${this.#tagName}>`

    this.#initProps(propsChain)

    const className: string = this.#className ? `class="${this.#getClassName()}"` : ''
    const attrs: string = this.#getAttrs().reduce(
      (prev, [key, value]) => `${prev} ${this.#toKebabCase(key)}="${value}"`,
      ''
    )
    const slotId: string = `${this.#ficsId}-slot`
    const style: string =
      this.#css.length > 0 ? `<style>${this.#getStyle(this.#css, `#${slotId}`)}</style>` : ''

    return `
        <${[this.#tagName, className, attrs].join(' ').trim()}>
          <template shadowrootmode="open"><slot name="${this.#ficsId}"></slot></template>
          <div id="${slotId}" slot="${this.#ficsId}">
            ${this.#getHtml().reduce(
              (prev, curr) =>
                `${prev}${
                  curr instanceof FiCsElement ? curr.#renderOnServer(this.#propsChain) : curr
                }`,
              style
            )}
          </div>
        </${this.#tagName}>
      `.trim()
  }

  #addClassName(component: HTMLElement): void {
    if (this.#className) component.setAttribute('class', this.#getClassName())
  }

  #addAttrs(component: HTMLElement): void {
    for (const [key, value] of this.#getAttrs())
      component.setAttribute(this.#toKebabCase(key), value)
  }

  #getChildNodes(parent: ShadowRoot | DocumentFragment | ChildNode): ChildNode[] {
    return Array.from(parent.childNodes)
  }

  #removeChildNodes(param: HTMLElement | ChildNode[]): void {
    for (const childNode of param instanceof HTMLElement ? this.#getChildNodes(param) : param)
      childNode.remove()
  }

  #toCamelCase(str: string): string {
    return str.toLowerCase().replaceAll(/-([a-z])/g, (_, char) => char.toUpperCase())
  }

  #setProperty<V>(element: HTMLElement, property: string, value: V): void {
    ;(element as any)[this.#toCamelCase(property)] = value
  }

  #addHtml(shadowRoot: ShadowRoot): void {
    const oldChildNodes: ChildNode[] = this.#getChildNodes(shadowRoot)
    const getFiCsId = (element: Element, isProperty?: boolean): string | null =>
      isProperty
        ? (element as any)[this.#toCamelCase(this.#ficsIdName)]
        : element.getAttribute(this.#ficsIdName)

    const children: Record<string, FiCsElement<D, P>> = {}
    const varTag: string = 'f-var'
    const newShadowRoot: DocumentFragment = document.createRange().createContextualFragment(
      this.#getHtml().reduce((prev, curr) => {
        if (curr instanceof FiCsElement) {
          const ficsId: string = curr.#ficsId
          children[ficsId] = curr

          curr = `<${varTag} ${this.#ficsIdName}="${ficsId}"></${varTag}>`
        }

        return `${prev}${curr}`
      }, '') as string
    )
    const isVarTag = (element: Element): boolean => element.localName === varTag
    const newChildNodes: ChildNode[] = this.#getChildNodes(newShadowRoot)
    const blankTexts: Text[] = new Array()

    const convertChildNodes = (childNodes: ChildNode[]): void => {
      for (const childNode of childNodes) {
        if (childNode instanceof Text && childNode.nodeValue) {
          childNode.nodeValue = childNode.nodeValue.trim()
          if (childNode.nodeValue === '') blankTexts.push(childNode)
          continue
        }

        if (childNode instanceof Element) {
          if (isVarTag(childNode)) continue

          if (childNode.hasAttribute(this.#showAttr)) {
            ;(childNode as HTMLElement).style.display = 'none'
            childNode.removeAttribute(this.#showAttr)
          }
        }

        convertChildNodes(this.#getChildNodes(childNode))
      }
    }
    const getChild = (element: Element): Element => {
      const ficsId: string | null = getFiCsId(element)

      if (ficsId) return children[ficsId].#render(this.#propsChain)
      else throw new Error(`The child FiCsElement has ficsId does not exist...`)
    }

    convertChildNodes(newChildNodes)

    if (oldChildNodes.length === 0)
      for (const childNode of newChildNodes) {
        shadowRoot.append(childNode)

        if (childNode instanceof HTMLElement)
          if (isVarTag(childNode)) childNode.replaceWith(getChild(childNode))
          else
            for (const element of Array.from(childNode.querySelectorAll(varTag)))
              element.replaceWith(getChild(element))
      }
    else if (newChildNodes.length === 0) this.#removeChildNodes(oldChildNodes)
    else {
      const that: FiCsElement<D, P> = this
      let { activeElement }: { activeElement: Element | null } = shadowRoot

      const matchChildNode = (oldChildNode: ChildNode, newChildNode: ChildNode): boolean => {
        const isSameNode: boolean = oldChildNode.nodeName === newChildNode.nodeName

        if (oldChildNode instanceof Element && newChildNode instanceof Element) {
          const isSameFiCsId: boolean =
            isVarTag(newChildNode) && getFiCsId(oldChildNode, true) === getFiCsId(newChildNode)
          const isSameKey: boolean =
            oldChildNode.getAttribute('key') === newChildNode.getAttribute('key')

          return isSameFiCsId || (isSameNode && isSameKey)
        }

        return isSameNode
      }

      function patchChildNode(oldChildNode: ChildNode, newChildNode: ChildNode): void {
        if (oldChildNode instanceof Text && newChildNode instanceof Text)
          oldChildNode.nodeValue = newChildNode.nodeValue
        else if (
          oldChildNode instanceof Element &&
          newChildNode instanceof Element &&
          !isVarTag(newChildNode)
        ) {
          const oldAttrs: NamedNodeMap = oldChildNode.attributes
          const newAttrs: NamedNodeMap = newChildNode.attributes
          const oldAttrList: Record<string, string> = {}

          for (let index = 0; index < oldAttrs.length; index++) {
            const { name, value } = oldAttrs[index]
            oldAttrList[name] = value
          }

          const { namespaceURI }: { namespaceURI: string | null } = oldChildNode

          for (let index = 0; index < newAttrs.length; index++) {
            const { name, value }: { name: string; value: string } = newAttrs[index]

            if (oldAttrList[name] !== value) {
              if (oldChildNode instanceof HTMLElement) {
                oldChildNode.setAttribute(name, value)

                if (name !== that.#ficsIdName) that.#setProperty(oldChildNode, name, value)
              } else oldChildNode.setAttributeNS(namespaceURI, name, value)
            }

            delete oldAttrList[name]
          }

          for (const name in oldAttrList)
            if (oldChildNode instanceof HTMLElement) oldChildNode.removeAttribute(name)
            else oldChildNode.removeAttributeNS(namespaceURI, name)

          updateChildNodes(
            oldChildNode,
            that.#getChildNodes(oldChildNode),
            that.#getChildNodes(newChildNode)
          )
        }
      }

      function updateChildNodes(
        parentNode: ShadowRoot | ChildNode,
        oldChildNodes: ChildNode[],
        newChildNodes: ChildNode[]
      ): void {
        oldChildNodes = oldChildNodes.filter(
          oldChildNode => !(oldChildNode instanceof Text && oldChildNode.nodeValue === '')
        )

        const set: Set<ChildNode> = new Set(newChildNodes)
        for (const blankText of blankTexts) set.delete(blankText)
        newChildNodes = Array.from(set)

        let oldStartIndex: number = 0
        let oldEndIndex: number = oldChildNodes.length - 1
        let oldStartNode: ChildNode = oldChildNodes[oldStartIndex]
        let oldEndNode: ChildNode = oldChildNodes[oldEndIndex]
        let newStartIndex: number = 0
        let newEndIndex: number = newChildNodes.length - 1
        let newStartNode: ChildNode = newChildNodes[newStartIndex]
        let newEndNode: ChildNode = newChildNodes[newEndIndex]
        const dom: Map<string, ChildNode[]> = new Map()
        const keyChildNodes: Map<string, ChildNode> = new Map()

        const insertBefore = (childNode: ChildNode, before: ChildNode | null): void => {
          if (childNode instanceof Element)
            if (isVarTag(childNode)) childNode = getChild(childNode)
            else that.#newElements.add(childNode)

          if (before instanceof Element && isVarTag(before)) before = getChild(before)

          parentNode.insertBefore(
            childNode,
            before && !before.parentNode?.isEqualNode(parentNode) ? oldStartNode : before
          )
        }

        const focusNode = (childNode: ChildNode): void => {
          if (
            activeElement &&
            childNode instanceof HTMLElement &&
            matchChildNode(childNode, activeElement)
          ) {
            activeElement = null
            childNode.focus()

            if (childNode instanceof HTMLInputElement || childNode instanceof HTMLTextAreaElement) {
              const { length }: { length: number } = childNode.value
              childNode.setSelectionRange(length, length)
            }
          }
        }

        const getMapKey = (childNode: ChildNode): string => {
          const { nodeName }: { nodeName: string } = childNode
          const key: string | null =
            childNode instanceof Element ? childNode.getAttribute('key') : null

          return key ? `${nodeName}-${key}` : nodeName
        }

        while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex)
          if (matchChildNode(oldStartNode, newStartNode)) {
            patchChildNode(oldStartNode, newStartNode)
            oldStartNode = oldChildNodes[++oldStartIndex]
            newStartNode = newChildNodes[++newStartIndex]
          } else if (matchChildNode(oldEndNode, newEndNode)) {
            patchChildNode(oldEndNode, newEndNode)
            oldEndNode = oldChildNodes[--oldEndIndex]
            newEndNode = newChildNodes[--newEndIndex]
          } else if (matchChildNode(oldStartNode, newEndNode)) {
            patchChildNode(oldStartNode, newEndNode)
            insertBefore(oldStartNode, newEndNode.nextSibling)
            focusNode(oldStartNode)
            oldStartNode = oldChildNodes[++oldStartIndex]
            newEndNode = newChildNodes[--newEndIndex]
          } else if (matchChildNode(oldEndNode, newStartNode)) {
            patchChildNode(oldEndNode, newStartNode)
            insertBefore(oldEndNode, oldStartNode)
            focusNode(oldEndNode)
            oldEndNode = oldChildNodes[--oldEndIndex]
            newStartNode = newChildNodes[++newStartIndex]
          } else {
            const keys: Record<string, true> = {}

            if (dom.size === 0)
              for (let i = oldStartIndex; i < oldEndIndex; i++) {
                const oldChildNode: ChildNode = oldChildNodes[i]

                if (oldChildNode instanceof Element && !!getFiCsId(oldChildNode, true)) continue

                const mapKey: string = getMapKey(oldChildNode)
                dom.set(mapKey, [...(dom.get(mapKey) ?? []), oldChildNode])

                const key: string | null =
                  oldChildNode instanceof Element ? oldChildNode.getAttribute('key') : null

                if (!key) continue

                keys[key]
                  ? console.warn(`The key name "${key}" is duplicated...`)
                  : (keys[key] = true)
              }

            const mapStartNode: ChildNode | undefined = dom.get(getMapKey(newStartNode))?.shift()

            if (mapStartNode?.nodeName === newStartNode.nodeName) {
              patchChildNode(mapStartNode, newStartNode)
              keyChildNodes.set(getMapKey(mapStartNode), mapStartNode)
            } else {
              insertBefore(newStartNode, oldStartNode)
              focusNode(newStartNode)
            }

            newStartNode = newChildNodes[++newStartIndex]
          }

        while (newStartIndex <= newEndIndex)
          insertBefore(newChildNodes[newStartIndex++], newChildNodes[newEndIndex + 1])

        while (oldStartIndex <= oldEndIndex) {
          const childNode: ChildNode = oldChildNodes[oldStartIndex++]

          if (!keyChildNodes.get(getMapKey(childNode))) childNode.remove()
          focusNode(childNode)
        }
      }

      updateChildNodes(shadowRoot, oldChildNodes, newChildNodes)
    }
  }

  #addCss(shadowRoot: ShadowRoot, css: Css<D, P> = new Array()): void {
    if (this.#css.length === 0) return

    if (!this.#isImmutable && css.length === 0)
      for (const [index, content] of this.#css.entries())
        if (typeof content !== 'string' && typeof content.style === 'function')
          this.#bindings.css.push(index)

    const stylesheet: CSSStyleSheet = new CSSStyleSheet()
    const style: Css<D, P> =
      css.length > 0 ? Array.from(new Set([...this.#css, ...css])) : this.#css

    shadowRoot.adoptedStyleSheets = [stylesheet]
    stylesheet.replaceSync(this.#getStyle(style))
  }

  #getShadowRoot(component: HTMLElement): ShadowRoot {
    if (component.shadowRoot) return component.shadowRoot

    throw new Error(`${this.#tagName} does not have shadowRoot...`)
  }

  #addEventListener(
    element: Element,
    handler: string,
    method: Method<D, P>,
    enterKey?: boolean
  ): void {
    const getMethodParam = (event: Event): Param<D, P> & { $event: Event } => ({
      ...this.#setDataProps(),
      $setData: (key: keyof D, value: D[typeof key]): void => this.setData(key, value),
      $getData: (key: keyof D): D[typeof key] => this.getData(key),
      $event: event
    })

    element.addEventListener(handler, (event: Event): void => method(getMethodParam(event)))

    if (handler === 'click' && enterKey)
      element.addEventListener('keydown', (event: Event): void => {
        const { key }: { key: string } = event as KeyboardEvent

        if (key === 'Enter') method(getMethodParam(event))
      })
  }

  #getElements(shadowRoot: ShadowRoot, selector: string): Element[] {
    return Array.from(shadowRoot.querySelectorAll(`:host ${selector}`))
  }

  #addActions(component: HTMLElement): void {
    if (this.#actions.length > 0)
      for (const action of this.#actions) {
        const { handler, selector, method, enterKey }: Action<D, P> = action

        if (!this.#isImmutable && selector) {
          this.#bindings.actions.push(action)

          for (const element of this.#getElements(this.#getShadowRoot(component), selector))
            this.#addEventListener(element, handler, method, enterKey)
        } else this.#addEventListener(component, handler, method, enterKey)
      }
  }

  #callback(key: keyof Hooks<D, P>): void {
    this.#hooks[key]?.({
      ...this.#setDataProps(),
      $setData: (key: keyof D, value: D[typeof key]): void => this.setData(key, value),
      $getData: (key: keyof D): D[typeof key] => this.getData(key)
    })
  }

  #render(propsChain: PropsChain<P>): HTMLElement {
    const that: FiCsElement<D, P> = this

    if (!customElements.get(that.#tagName))
      customElements.define(
        that.#tagName,
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
          }

          connectedCallback(): void {
            that.#callback('connect')
          }

          disconnectedCallback(): void {
            that.#callback('disconnect')
          }

          adoptedCallback(): void {
            that.#callback('adopt')
          }
        }
      )

    const component: HTMLElement = document.createElement(that.#tagName)
    const shadowRoot: ShadowRoot = that.#getShadowRoot(component)

    that.#initProps(propsChain)
    that.#addClassName(component)
    that.#addAttrs(component)
    that.#addHtml(shadowRoot)
    that.#addCss(shadowRoot)
    that.#addActions(component)
    that.#removeChildNodes(component)
    that.#setProperty(component, that.#ficsIdName, that.#ficsId)
    that.#components.add(component)

    return component
  }

  #reRender(): void {
    for (const component of this.#components) {
      const { isClassName, isAttr, css, actions }: Bindings<D, P> = this.#bindings
      const shadowRoot: ShadowRoot = this.#getShadowRoot(component)

      if (isClassName) {
        component.classList.remove(...Array.from(component.classList))
        this.#addClassName(component)
      }

      if (isAttr) this.#addAttrs(component)

      this.#addHtml(shadowRoot)

      if (css.length > 0)
        this.#addCss(
          shadowRoot,
          css.map(index => this.#css[index])
        )

      if (actions.length > 0)
        for (const action of actions) {
          const { handler, selector, method, enterKey }: Action<D, P> = action

          if (selector)
            for (const element of this.#getElements(shadowRoot, selector))
              if (this.#newElements.has(element))
                this.#addEventListener(element, handler, method, enterKey)
        }

      this.#newElements.clear()
    }
  }

  getData<K extends keyof D>(key: K): D[typeof key] {
    if (key in this.#data) return this.#data[key]

    throw new Error(`"${key as string}" is not defined in data...`)
  }

  setData(key: keyof D, value: D[typeof key]): void {
    if (this.#isReflecting) throw new Error(`"${key as string}" is not changed in reflections...`)
    else if (!(key in this.#data)) throw new Error(`"${key as string}" is not defined in data...`)
    else if (this.#data[key] !== value) {
      this.#data[key] = value
      addToQueue({ ficsId: this.#ficsId, reRender: this.#reRender() })

      for (const { dataKey, setProps } of this.#propsTrees)
        if (dataKey === key) setProps(value as unknown as P[keyof P])

      if (this.#reflections && key in this.#reflections) {
        this.#isReflecting = true
        this.#reflections[key]?.(this.#data[key])
        this.#isReflecting = false
      }
    }
  }

  ssr(parent?: HTMLElement | string): void {
    const component: string = this.#renderOnServer(this.#propsChain)

    if (parent instanceof HTMLElement) parent.setHTMLUnsafe(component)
    else if (typeof parent === 'string') {
      const parentElement: HTMLElement | null = document.getElementById(parent)

      if (parentElement) parentElement.setHTMLUnsafe(component)
      else throw new Error(`The HTMLElement has #${parent} does not exist...`)
    }
  }

  define(parent?: HTMLElement | string): void {
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
              that.#callback('connect')
              that.#initProps(that.#propsChain)
              that.#addClassName(this)
              that.#addAttrs(this)
              that.#addHtml(this.shadowRoot)
              that.#addCss(this.shadowRoot)
              that.#addActions(this)
              that.#removeChildNodes(this)
              that.#setProperty(this, that.#ficsIdName, that.#ficsId)
              that.#components.add(this)
              this.#isRendered = true
            }
          }

          disconnectedCallback(): void {
            that.#callback('disconnect')
          }

          adoptedCallback(): void {
            that.#callback('adopt')
          }
        }
      )

      if (parent) {
        const component = document.createElement(this.#tagName).cloneNode(true)

        if (parent instanceof HTMLElement) parent.append(component)
        else {
          const parentElement: HTMLElement | null = document.getElementById(parent)

          if (parentElement) parentElement.append(component)
          else throw new Error(`The HTMLElement has #${parent} does not exist...`)
        }
      }
    }
  }
}
