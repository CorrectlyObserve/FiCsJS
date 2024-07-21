import generate from './generator'
import addQueue from './queue'
import type {
  Action,
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
  PropsChain,
  PropsTree,
  Reflections,
  Sanitize,
  Style,
  Symbolized
} from './types'

const symbol: symbol = Symbol('sanitized')
const ficsIdGenerator: Generator<number> = generate()

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
  readonly #html: Html<D, P>
  readonly #css: Css<D, P> = new Array()
  readonly #actions: Action<D, P>[] = new Array()
  readonly #hooks: Hooks<D, P> = {} as Hooks<D, P>
  readonly #propsTrees: PropsTree<D, P>[] = new Array()
  readonly #bindings: Bindings = {
    className: false,
    html: false,
    css: new Array(),
    actions: new Array()
  }
  readonly #ficsIdName: string = 'fics-id'
  readonly #ficsPropertyGenerator: Generator<number> = generate()
  readonly #childNodeMap: Map<ChildNode, { childNode: ChildNode; property: string }> = new Map()
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
    html,
    css,
    actions,
    hooks
  }: FiCs<D, P>) {
    this.#name = this.#toKebabCase(name)

    if (isExceptional && this.#name in this.#reservedWords) delete this.#reservedWords[this.#name]

    if (this.#reservedWords[this.#name]) throw new Error(`${name} is a reserved word in FiCsJS...`)
    else {
      this.#ficsId = `fics${ficsIdGenerator.next().value}`
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
      if (className) this.#className = className
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

  #internationalize = ({ json, lang, keys }: I18n): string => {
    let texts: Record<string, string> | string = json[lang]

    if (texts) {
      for (const key of Array.isArray(keys) ? keys : [keys])
        if (typeof texts === 'object' && texts !== null && key in texts) texts = texts[key]

      if (typeof texts === 'string') return texts

      throw new Error(`There is no applicable value in json..`)
    } else throw new Error(`${lang}.json does not exist...`)
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

    const i18n = ({ json, lang, keys }: I18n): string =>
      this.#internationalize({ json, lang, keys })

    return this.#html({ ...this.#setDataProps(), template, html, i18n })[symbol]
  }

  #getClassName = (): string | undefined =>
    typeof this.#className === 'function' ? this.#className(this.#setDataProps()) : this.#className

  #renderOnServer = (propsChain: PropsChain<P>): string => {
    if (this.#isOnlyCsr) return `<${this.#tagName}></${this.#tagName}>`

    this.#initProps(propsChain)

    const slotId: string = `${this.#ficsId}-slot`
    const style: string =
      this.#css.length > 0 ? `<style>${this.#getStyle(this.#css, `#${slotId}`)}</style>` : ''

    return `
        <${this.#tagName} class="${`${this.#name} ${this.#getClassName() ?? ''}`.trim()}">
          <template shadowrootmode="open"><slot name="${this.#ficsId}"></slot></template>
          <div id="${slotId}" slot="${this.#ficsId}">
            ${style}
            ${this.#getHtml().reduce(
              (prev, curr) =>
                `${prev}${
                  curr instanceof FiCsElement ? curr.#renderOnServer(this.#propsChain) : curr
                }`,
              ''
            )}
          </div>
        </${this.#tagName}>
      `.trim()
  }

  #addClassName = (fics: HTMLElement, isRerendering?: boolean): void => {
    if (isRerendering) fics.classList.remove(...Array.from(fics.classList))
    else if (!this.#isImmutable) this.#bindings.className = typeof this.#className === 'function'

    this.#className
      ? fics.setAttribute('class', `${this.#name} ${this.#getClassName()}`)
      : fics.classList.add(this.#name)
  }

  #getChildNodes = (parent: ShadowRoot | DocumentFragment | Element): ChildNode[] =>
    Array.from(parent.childNodes)

  #removeChildNodes = (childNodes: ChildNode[]): void => {
    for (const childNode of childNodes) childNode.remove()
  }

  #toCamelCase = (str: string): string =>
    str.toLowerCase().replaceAll(/-([a-z])/g, (_, char) => char.toUpperCase())

  #setProperty = <V>(element: ChildNode, attr: string, value: V): void => {
    ;(element as any)[this.#toCamelCase(attr)] = value
  }

  #addHtml(shadowRoot: ShadowRoot, isRerendering?: boolean): void {
    const deleteNewLines = (parent: ShadowRoot | DocumentFragment | Element): ChildNode[] =>
      this.#getChildNodes(parent).filter(
        ({ nodeType, textContent }) => !(nodeType === Node.TEXT_NODE && !textContent?.trim())
      )
    const oldChildNodes: ChildNode[] = deleteNewLines(shadowRoot)
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
    const ficsProperty: string = 'fics-property'
    const getNewProperty = (): string =>
      `${ficsProperty}-${this.#ficsPropertyGenerator.next().value}`

    const getProperty = (childNode: ChildNode, property: string): string | null =>
      (childNode as any)[this.#toCamelCase(property)]

    const getFiCsId = (element: Element, isAttr?: boolean): string | null =>
      isAttr ? element.getAttribute(this.#ficsIdName) : getProperty(element, this.#ficsIdName)

    const getFiCsProperty = (childNode: ChildNode): string | null =>
      getProperty(childNode, ficsProperty)
    const isVarTag = (element: Element): boolean => element.localName === varTag

    if (!isRerendering || oldChildNodes.length === 0) {
      if (!this.#isImmutable) this.#bindings.html = typeof this.#html === 'function'

      const saveToMap = (childNode: ChildNode): void => {
        const isBreak: boolean =
          childNode.nodeType === Node.TEXT_NODE && !childNode.nodeValue?.trim()
        const isFiCsElement: boolean = childNode instanceof Element && !!getFiCsId(childNode)

        if (!this.#isImmutable && !isBreak && !isFiCsElement) {
          const property: string = getNewProperty()
          this.#setProperty(childNode, ficsProperty, property)
          this.#childNodeMap.set(childNode, { childNode, property })
        }
      }
      const getAllChildNodes = (element: ChildNode): void => {
        if (element instanceof Element) {
          if (isVarTag(element)) {
            const ficsId: string | null = getFiCsId(element, true)

            if (ficsId) {
              const child: FiCsElement<D, P> = children[ficsId]

              element.replaceWith(
                child.#isImmutable && child.#component
                  ? child.#component
                  : child.#render(this.#propsChain)
              )
            } else throw new Error(`The child FiCsElement has ${ficsId} does not exist...`)
          } else
            for (const childNode of this.#getChildNodes(element)) {
              saveToMap(childNode)
              getAllChildNodes(childNode)
            }
        }
      }

      for (const childNode of this.#getChildNodes(newShadowRoot)) {
        if (childNode instanceof Element && isVarTag(childNode)) {
          const ficsId: string | null = getFiCsId(childNode, true)

          if (ficsId) {
            const child: FiCsElement<D, P> = children[ficsId]

            shadowRoot.append(
              child.#isImmutable && child.#component
                ? child.#component
                : child.#render(this.#propsChain)
            )
          } else throw new Error(`The child FiCsElement has ${ficsId} does not exist...`)
        } else {
          saveToMap(childNode)
          getAllChildNodes(childNode)
          shadowRoot.append(childNode)
        }
      }
    } else if (deleteNewLines(newShadowRoot).length === 0) {
      this.#removeChildNodes(oldChildNodes)
      this.#childNodeMap.clear()
    } else {
      const that: FiCsElement<D, P> = this
      const newChildNodes: ChildNode[] = deleteNewLines(newShadowRoot)

      function matchChildNode(oldChildNode: ChildNode, newChildNode: ChildNode): boolean {
        const isSameNode: boolean = oldChildNode.nodeName === newChildNode.nodeName

        if (oldChildNode instanceof Element && newChildNode instanceof Element) {
          const isFiCsElement: boolean =
            getFiCsId(oldChildNode) === getFiCsId(newChildNode, true) && isVarTag(newChildNode)
          const isSameProperty: boolean =
            getFiCsProperty(oldChildNode) === getFiCsProperty(newChildNode)

          return isFiCsElement || (isSameNode && isSameProperty)
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

          const namespace: string | null = oldChildNode.namespaceURI

          for (let index = 0; index < newAttrs.length; index++) {
            const { name, value }: { name: string; value: string } = newAttrs[index]

            if (oldAttrList[name] !== value) {
              if (oldChildNode instanceof HTMLElement) {
                oldChildNode.setAttribute(name, value)
                if (name !== that.#ficsIdName) that.#setProperty(oldChildNode, name, value)
              } else oldChildNode.setAttributeNS(namespace, name, value)
            }

            delete oldAttrList[name]
          }

          for (const name in oldAttrList)
            if (oldChildNode instanceof HTMLElement) oldChildNode.removeAttribute(name)
            else oldChildNode.removeAttributeNS(namespace, name)

          updateChildNodes(oldChildNode, deleteNewLines(oldChildNode), deleteNewLines(newChildNode))
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
            const ficsId: string | null = getFiCsId(childNode, true)
            const component: HTMLElement | undefined = children[ficsId ?? ''].#component

            if (component) return component as T
            else throw new Error(`The child FiCsElement has ${ficsId} does not exist...`)
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
        let mapHead: { childNode: ChildNode; property: string } | undefined = undefined

        console.log(oldChildNodes, newChildNodes)

        while (oldHead <= oldTail && newHead <= newTail) {
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
            mapHead = that.#childNodeMap.get(newHeadNode)

            if (mapHead === undefined) {
              insertBefore(parentNode, newHeadNode, oldHeadNode)
              newHeadNode = newChildNodes[++newHead]
            } else if (that.#childNodeMap.get(newTailNode) === undefined) {
              insertBefore(parentNode, newTailNode, oldTailNode.nextSibling)
              newTailNode = newChildNodes[--newTail]
            } else {
              const { childNode }: { childNode: ChildNode } = mapHead
              if (childNode.nodeName === newHeadNode.nodeName)
                patchChildNode(childNode, newHeadNode)
              else {
                insertBefore(parentNode, newHeadNode, oldHeadNode)
                childNode.remove()
              }

              newHeadNode = newChildNodes[++newHead]
            }
          }
        }

        if (newHead <= newTail)
          for (; newHead <= newTail; ++newHead) {
            const childNode: ChildNode | null = newChildNodes[newHead]

            if (childNode) insertBefore(parentNode, childNode, newChildNodes[newTail + 1] ?? null)
          }

        if (oldHead <= oldTail)
          for (; oldHead <= oldTail; ++oldHead) oldChildNodes[oldHead].remove()
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

  #addEvent = (element: Element, handler: string, method: Method<D, P>): void =>
    element.addEventListener(handler, (event: Event) =>
      method({
        ...this.#setDataProps(),
        setData: (key: keyof D, value: D[typeof key]): void => this.setData(key, value),
        event
      })
    )

  #getElements = (shadowRoot: ShadowRoot, selector: string): Element[] =>
    Array.from(shadowRoot.querySelectorAll(`:host ${selector}`))

  #addActions = (fics: HTMLElement): void => {
    if (this.#actions.length > 0)
      this.#actions.forEach((action, index) => {
        const { handler, selector, method }: Action<D, P> = action

        if (!this.#isImmutable && selector) {
          this.#bindings.actions.push(index)

          for (const element of this.#getElements(this.#getShadowRoot(fics), selector))
            this.#addEvent(element, handler, method)
        } else this.#addEvent(fics, handler, method)
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

    const fics = document.createElement(this.#tagName)
    this.#setProperty(fics, this.#ficsIdName, this.#ficsId)
    this.#initProps(propsChain)
    this.#addClassName(fics)
    this.#addHtml(this.#getShadowRoot(fics))
    this.#addCss(this.#getShadowRoot(fics))
    this.#addActions(fics)

    if (!this.#component) {
      this.#removeChildNodes(this.#getChildNodes(fics))
      this.#component = fics
    }

    return fics
  }

  #reRender = (): void => {
    const fics: HTMLElement | undefined = this.#component

    if (fics) {
      const { className, html, css, actions }: Bindings = this.#bindings
      const shadowRoot: ShadowRoot = this.#getShadowRoot(fics)

      if (className) this.#addClassName(fics, true)

      if (html) this.#addHtml(shadowRoot, true)

      if (css.length > 0)
        this.#addCss(
          shadowRoot,
          css.map(index => this.#css[index])
        )

      if (actions.length > 0)
        for (const index of actions) {
          const { handler, selector, method }: Action<D, P> = this.#actions[index]

          if (selector) {
            for (const element of this.#getElements(shadowRoot, selector))
              if (this.#newElements.has(element)) this.#addEvent(element, handler, method)
          }
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
              that.#addHtml(that.#getShadowRoot(this))
              that.#addCss(that.#getShadowRoot(this))
              that.#addActions(this)
              that.#callback('connect')
              that.#removeChildNodes(that.#getChildNodes(this))
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
