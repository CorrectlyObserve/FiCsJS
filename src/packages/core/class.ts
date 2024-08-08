import generate from './generator'
import addQueue from './queue'
import type {
  Action,
  Attributes,
  Bindings,
  ClassName,
  Css,
  DataProps,
  FiCs,
  Html,
  HtmlContents,
  Hooks,
  Inheritances,
  I18n,
  Method,
  Param,
  PropsChain,
  PropsTree,
  Reflections,
  Sanitize,
  Style,
  Symbolized
} from './types'

const symbol: symbol = Symbol('sanitized')
const generator: Generator<number> = generate()

export default class FiCsElement<D extends object, P extends object> {
  readonly #reservedWords: Record<string, boolean> = { var: true, router: true }
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
  readonly #attributes: Attributes<D, P> | undefined = undefined
  readonly #html: Html<D, P>
  readonly #css: Css<D, P> = new Array()
  readonly #actions: Action<D, P>[] = new Array()
  readonly #hooks: Hooks<D, P> = {} as Hooks<D, P>
  readonly #propsTrees: PropsTree<D, P>[] = new Array()
  readonly #bindings: Bindings = {
    className: false,
    attributes: false,
    html: false,
    css: new Array(),
    actions: new Array()
  }
  readonly #ficsIdName: string = 'fics-id'
  readonly #newElements: Set<Element> = new Set()

  #propsChain: PropsChain<P> = new Map()
  #component: HTMLElement | undefined = undefined
  #isReflecting: boolean = false

  constructor({
    isExceptional,
    name,
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

    if (isExceptional && this.#name in this.#reservedWords) delete this.#reservedWords[this.#name]

    if (this.#reservedWords[this.#name]) throw new Error(`${name} is a reserved word in FiCsJS...`)
    else {
      this.#ficsId = `fics${generator.next().value}`
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
            if (!(key in data())) throw new Error(`${key} is not defined in data...`)

          this.#reflections = { ...reflections }
        }

        for (const [key, value] of Object.entries(data())) this.#data[key as keyof D] = value
      }

      if (inheritances && inheritances.length > 0) this.#inheritances = [...inheritances]
      if (props) this.#props = { ...props } as P

      if (isOnlyCsr) this.#isOnlyCsr = true

      if (className)
        this.#className =
          typeof className === 'function' ? className(this.#setDataProps()) : className

      if (attributes)
        this.#attributes = {
          ...(typeof attributes === 'function' ? attributes(this.#setDataProps()) : attributes)
        }

      this.#html = html

      if (css && css.length > 0) this.#css = [...css]
      if (actions && actions.length > 0) this.#actions = [...actions]
      if (hooks) this.#hooks = { ...hooks }
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

          let dataKey: keyof D = '' as keyof D
          const data: [string, P][] = Object.entries({
            ...values((key: keyof D) => {
              dataKey = key

              return this.getData(dataKey)
            })
          })
          const descendantId: string = descendant.#ficsId

          for (const [key, value] of data) {
            const chain: Record<string, P> = propsChain.get(descendantId) ?? {}

            if (key in chain && propsChain.has(descendantId)) continue

            const numberId: number = parseInt(descendantId.replace('fics', ''))

            propsChain.set(descendantId, { ...chain, [key]: value })

            const { length }: { length: number } = this.#propsTrees
            const tree: PropsTree<D, P> = {
              numberId,
              dataKey,
              setProps: (value: P[keyof P]) => descendant.#setProps(key, value)
            }

            switch (length) {
              case 0:
                this.#propsTrees.push(tree)
                break

              case 1:
                this.#propsTrees[0].numberId > tree.numberId
                  ? this.#propsTrees.push(tree)
                  : this.#propsTrees.unshift(tree)
                break

              default:
                let min: number = 0
                let max: number = length - 1

                while (min <= max) {
                  const mid: number = Math.floor((min + max) / 2)

                  if (this.#propsTrees[mid].numberId <= tree.numberId) max = mid - 1
                  else min = mid + 1
                }

                this.#propsTrees.splice(min, 0, tree)
            }
          }
        }

    this.#propsChain = new Map(propsChain)

    for (const [key, value] of Object.entries(this.#propsChain.get(this.#ficsId) ?? {}))
      this.#props[key as keyof P] = value as P[keyof P]
  }

  #setDataProps = (): DataProps<D, P> =>
    this.#isImmutable
      ? { data: {} as D, props: {} as P }
      : { data: { ...this.#data }, props: { ...this.#props } }

  #getStyle = (css: Css<D, P>, host: string = ':host'): string => {
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

  #sanitize = (
    isSanitized: boolean,
    templates: TemplateStringsArray,
    variables: unknown[]
  ): Record<symbol, HtmlContents<D, P>> => {
    let result: (HtmlContents<D, P> | unknown)[] = new Array()

    for (let [index, template] of templates.entries()) {
      template = template.trim()
      let variable: any = variables[index]

      if (variable && typeof variable === 'object' && symbol in variable) {
        if (typeof variable[symbol][0] === 'string')
          variable[symbol][0] = template + variable[symbol][0]
        else variable[symbol].unshift(template)

        result = [...result, ...variable[symbol]]
      } else {
        if (isSanitized && typeof variable === 'string')
          variable = variable.replaceAll(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
        else if (variable === undefined) variable = ''

        if (index === 0 && template === '') result.push(variable)
        else {
          const { length } = result
          const last: HtmlContents<D, P> | unknown = result[length - 1] ?? ''
          const isFiCsElement: boolean = variable instanceof FiCsElement

          if (last instanceof FiCsElement)
            isFiCsElement ? result.push(template, variable) : result.push(`${template}${variable}`)
          else {
            const inserted: string = `${last}${template}` + `${isFiCsElement ? '' : variable}`
            result.splice(length - 1, 1, inserted)

            if (isFiCsElement) result.push(variable)
          }
        }
      }
    }

    return { [symbol]: result as HtmlContents<D, P> }
  }

  #getHtml = (): HtmlContents<D, P> => {
    const template: Sanitize<D, P, true> = (
      templates: TemplateStringsArray,
      ...variables: unknown[]
    ): Symbolized<HtmlContents<D, P>> => this.#sanitize(true, templates, variables)

    const html: Sanitize<D, P, false> = (
      templates: TemplateStringsArray,
      ...variables: unknown[]
    ): HtmlContents<D, P> => this.#sanitize(false, templates, variables)[symbol]

    const i18n = ({ json, lang, keys }: I18n): string => {
      let texts: Record<string, string> | string = json[lang]

      if (texts) {
        for (const key of Array.isArray(keys) ? keys : [keys])
          if (typeof texts === 'object' && texts !== null && key in texts) texts = texts[key]

        if (typeof texts === 'string') return texts

        throw new Error(`There is no applicable value in json..`)
      } else throw new Error(`${lang}.json does not exist...`)
    }

    return this.#html({ ...this.#setDataProps(), template, html, i18n })[symbol]
  }

  #renderOnServer = (propsChain: PropsChain<P>): string => {
    if (this.#isOnlyCsr) return `<${this.#tagName}></${this.#tagName}>`

    this.#initProps(propsChain)

    const classNames: string = `class="${this.#name}${this.#className ? ` ${this.#className}` : ''}"`
    const attrs: string = Object.entries(this.#attributes ?? []).reduce(
      (prev, [key, value]) => `${prev} ${this.#toKebabCase(key)}="${value}"`,
      ''
    )
    const slotId: string = `${this.#ficsId}-slot`
    const style: string =
      this.#css.length > 0 ? `<style>${this.#getStyle(this.#css, `#${slotId}`)}</style>` : ''

    return `
        <${[this.#tagName, classNames, attrs].join(' ').trim()}>
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

  #addClassName = (fics: HTMLElement, isRerendering?: boolean): void => {
    if (isRerendering) fics.classList.remove(...Array.from(fics.classList))
    else if (!this.#isImmutable) this.#bindings.className = typeof this.#className === 'function'

    this.#className
      ? fics.setAttribute('class', `${this.#name} ${this.#className}`)
      : fics.classList.add(this.#name)
  }

  #addAttributes = (fics: HTMLElement, isRerendering?: boolean): void => {
    if (this.#attributes) {
      if (isRerendering)
        for (const { name } of Array.from(fics.attributes)) fics.removeAttribute(name)
      else if (!this.#isImmutable)
        this.#bindings.attributes = typeof this.#attributes === 'function'

      for (const [key, value] of Object.entries(this.#attributes)) fics.setAttribute(key, value)
    }
  }

  #getChildNodes = (parent: ShadowRoot | DocumentFragment | Element): ChildNode[] =>
    Array.from(parent.childNodes)

  #removeChildNodes = (param: HTMLElement | ChildNode[]): void => {
    for (const childNode of param instanceof HTMLElement ? this.#getChildNodes(param) : param)
      childNode.remove()
  }

  #toCamelCase = (str: string): string =>
    str.toLowerCase().replaceAll(/-([a-z])/g, (_, char) => char.toUpperCase())

  #setProperty = <V>(element: HTMLElement, property: string, value: V): void => {
    ;(element as any)[this.#toCamelCase(property)] = value
  }

  #addHtml(shadowRoot: ShadowRoot, isRerendering?: boolean): void {
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
    const newChildNodes: ChildNode[] = this.#getChildNodes(newShadowRoot)
    const isVarTag = (element: Element): boolean => element.localName === varTag

    if (!isRerendering || oldChildNodes.length === 0) {
      if (!this.#isImmutable) this.#bindings.html = typeof this.#html === 'function'

      const loadChild = (element: Element): void => {
        const ficsId: string | null = getFiCsId(element)

        if (ficsId) {
          const fics: FiCsElement<D, P> = children[ficsId]

          element.replaceWith(
            fics.#isImmutable && fics.#component ? fics.#component : fics.#render(this.#propsChain)
          )
        } else throw new Error(`The child FiCsElement has ficsId does not exist...`)
      }

      for (const childNode of newChildNodes) {
        shadowRoot.append(childNode)

        if (childNode instanceof HTMLElement)
          if (isVarTag(childNode)) loadChild(childNode)
          else
            for (const element of Array.from(childNode.querySelectorAll(varTag))) loadChild(element)
      }
    } else if (newChildNodes.length === 0) this.#removeChildNodes(oldChildNodes)
    else {
      const that: FiCsElement<D, P> = this

      function matchChildNode(oldChildNode: ChildNode, newChildNode: ChildNode): boolean {
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
        if (oldChildNode.nodeName === '#text' && newChildNode.nodeName === '#text')
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

      function insertBefore(
        parentNode: ShadowRoot | ChildNode,
        childNode: ChildNode,
        before: ChildNode | null
      ): void {
        if (childNode instanceof Element) that.#newElements.add(childNode)

        const applyCache = <T>(childNode: T): T => {
          if (childNode instanceof Element && isVarTag(childNode)) {
            const ficsId: string | null = getFiCsId(childNode)

            if (ficsId) return children[ficsId].#component as T
            else throw new Error(`The child FiCsElement has FiCsId does not exist...`)
          }

          return childNode
        }

        parentNode.insertBefore(applyCache(childNode), applyCache(before))
      }

      function updateChildNodes(
        parentNode: ShadowRoot | ChildNode,
        oldChildNodes: ChildNode[],
        newChildNodes: ChildNode[]
      ): void {
        let oldHead: number = 0
        let oldTail: number = oldChildNodes.length - 1
        let oldHeadNode: ChildNode = oldChildNodes[oldHead]
        let oldTailNode: ChildNode = oldChildNodes[oldTail]
        let newHead: number = 0
        let newTail: number = newChildNodes.length - 1
        let newHeadNode: ChildNode = newChildNodes[newHead]
        let newTailNode: ChildNode = newChildNodes[newTail]
        let domMap: Map<string, ChildNode[]> = new Map()
        const getMapKey = (childNode: ChildNode): string => {
          if (childNode instanceof Element) {
            const key: string | null = childNode.getAttribute('key')

            return `${childNode.localName}${key ? `-${key}` : ''}`
          }

          return childNode.nodeName
        }
        const createMap = (childNodes: ChildNode[]): Map<string, ChildNode[]> => {
          const map: Map<string, ChildNode[]> = new Map()

          for (const childNode of childNodes) {
            if (childNode instanceof Element && !!getFiCsId(childNode, true)) continue

            map.set(getMapKey(childNode), [...(map.get(getMapKey(childNode)) ?? []), childNode])
          }

          return map
        }

        while (oldHead <= oldTail && newHead <= newTail)
          if (matchChildNode(oldHeadNode, newHeadNode)) {
            patchChildNode(oldHeadNode, newHeadNode)
            oldHeadNode = oldChildNodes[++oldHead]
            newHeadNode = newChildNodes[++newHead]
          } else if (matchChildNode(oldTailNode, newTailNode)) {
            patchChildNode(oldTailNode, newTailNode)
            oldTailNode = oldChildNodes[--oldTail]
            newTailNode = newChildNodes[--newTail]
          } else if (matchChildNode(oldHeadNode, newTailNode)) {
            patchChildNode(oldHeadNode, newTailNode)
            insertBefore(parentNode, oldHeadNode, newTailNode.nextSibling)
            oldHeadNode = oldChildNodes[++oldHead]
            newTailNode = newChildNodes[--newTail]
          } else if (matchChildNode(oldTailNode, newHeadNode)) {
            patchChildNode(oldTailNode, newHeadNode)
            insertBefore(parentNode, oldTailNode, oldHeadNode)
            oldTailNode = oldChildNodes[--oldTail]
            newHeadNode = newChildNodes[++newHead]
          } else {
            if (domMap.size === 0) domMap = createMap(oldChildNodes)

            const mapHeadNode: ChildNode | undefined = domMap.get(getMapKey(newHeadNode))?.shift()

            if (mapHeadNode === undefined) insertBefore(parentNode, newHeadNode, oldHeadNode)
            else if (mapHeadNode.nodeName === newHeadNode.nodeName)
              patchChildNode(mapHeadNode, newHeadNode)
            else insertBefore(parentNode, newHeadNode, oldHeadNode)

            newHeadNode = newChildNodes[++newHead]
          }

        while (newHead <= newTail) {
          const childNode: ChildNode | null = newChildNodes[newHead]
          if (childNode) insertBefore(parentNode, childNode, oldChildNodes[oldTail + 1])

          newHead++
        }

        if (oldHead <= oldTail) {
          const newDomMap: Map<string, ChildNode[]> = createMap(newChildNodes)

          for (; oldHead <= oldTail; ++oldHead) {
            const childNode: ChildNode = oldChildNodes[oldHead]

            if (!newDomMap.get(getMapKey(childNode))?.shift()) childNode.remove()
          }
        }
      }

      updateChildNodes(shadowRoot, oldChildNodes, newChildNodes)
    }
  }

  #addCss = (shadowRoot: ShadowRoot, css: Css<D, P> = new Array()): void => {
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

  #getShadowRoot = (fics: HTMLElement): ShadowRoot => {
    if (fics.shadowRoot) return fics.shadowRoot

    throw new Error(`${this.#name} does not have shadowRoot...`)
  }

  #addEventListener = (
    element: Element,
    handler: string,
    method: Method<D, P>,
    isEnterEnabled?: boolean
  ): void => {
    const getMethodParam = (event: Event): Param<D, P> & { event: Event } => ({
      ...this.#setDataProps(),
      setData: (key: keyof D, value: D[typeof key]): void => this.setData(key, value),
      event
    })

    element.addEventListener(handler, (event: Event) => method(getMethodParam(event)))

    if (handler === 'click' && isEnterEnabled)
      element.addEventListener('keydown', (event: Event) => {
        const { key }: { key: string } = event as KeyboardEvent

        if (key === 'Enter') method(getMethodParam(event))
      })
  }

  #getElements = (shadowRoot: ShadowRoot, selector: string): Element[] =>
    Array.from(shadowRoot.querySelectorAll(`:host ${selector}`))

  #addActions = (fics: HTMLElement): void => {
    if (this.#actions.length > 0)
      this.#actions.forEach((action, index) => {
        const { handler, selector, method, isEnterEnabled }: Action<D, P> = action

        if (!this.#isImmutable && selector) {
          this.#bindings.actions.push(index)

          for (const element of this.#getElements(this.#getShadowRoot(fics), selector))
            this.#addEventListener(element, handler, method, isEnterEnabled)
        } else this.#addEventListener(fics, handler, method, isEnterEnabled)
      })
  }

  #callback = (key: keyof Hooks<D, P>): void => {
    this.#hooks[key]?.({
      ...this.#setDataProps(),
      setData: (key: keyof D, value: D[typeof key]): void => this.setData(key, value)
    })
  }

  #render = (propsChain: PropsChain<P>): HTMLElement => {
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

    const fics: HTMLElement = document.createElement(this.#tagName)
    const shadowRoot: ShadowRoot = this.#getShadowRoot(fics)

    this.#setProperty(fics, this.#ficsIdName, this.#ficsId)
    this.#initProps(propsChain)
    this.#addClassName(fics)
    this.#addAttributes(fics)
    this.#addHtml(shadowRoot)
    this.#addCss(shadowRoot)
    this.#addActions(fics)

    if (!this.#component) {
      this.#removeChildNodes(fics)
      this.#component = fics
    }

    return fics
  }

  #reRender = (): void => {
    const fics: HTMLElement | undefined = this.#component

    if (fics) {
      const { className, attributes, html, css, actions }: Bindings = this.#bindings
      const shadowRoot: ShadowRoot = this.#getShadowRoot(fics)

      if (className) this.#addClassName(fics, true)

      if (attributes) this.#addAttributes(fics, true)

      if (html) this.#addHtml(shadowRoot, true)

      if (css.length > 0)
        this.#addCss(
          shadowRoot,
          css.map(index => this.#css[index])
        )

      if (actions.length > 0)
        for (const index of actions) {
          const { handler, selector, method, isEnterEnabled }: Action<D, P> = this.#actions[index]

          if (selector)
            for (const element of this.#getElements(shadowRoot, selector))
              if (this.#newElements.has(element))
                this.#addEventListener(element, handler, method, isEnterEnabled)
        }

      this.#newElements.clear()
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

      for (const { dataKey, setProps } of this.#propsTrees)
        if (dataKey === key) setProps(value as unknown as P[keyof P])

      if (this.#reflections && key in this.#reflections) {
        this.#isReflecting = true
        this.#reflections[key]?.(this.#data[key])
        this.#isReflecting = false
      }
    }
  }

  ssr = (parent?: HTMLElement | string): void => {
    const component: string = this.#renderOnServer(this.#propsChain)

    if (parent instanceof HTMLElement) parent.setHTMLUnsafe(component)
    else if (typeof parent === 'string') {
      const parentElement: HTMLElement | null = document.getElementById(parent)

      if (parentElement) parentElement.setHTMLUnsafe(component)
      else throw new Error(`The HTMLElement has #${parent} does not exist...`)
    }
  }

  define = (parent?: HTMLElement | string): void => {
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
              that.#addAttributes(this)
              that.#addHtml(this.shadowRoot)
              that.#addCss(this.shadowRoot)
              that.#addActions(this)
              that.#callback('connect')
              that.#removeChildNodes(this)
              that.#setProperty(this, that.#ficsIdName, that.#ficsId)
              that.#component = this
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
        const component = document.createElement(this.#tagName)

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
