import generate from './generator'
import { addToQueue } from './queue'
import type {
  Action,
  Attrs,
  Bindings,
  ClassName,
  Css,
  DataMethods,
  DataProps,
  FiCs,
  Html,
  HtmlContent,
  Hooks,
  Inheritances,
  I18n,
  Method,
  MethodParams,
  PropsChain,
  PropsTree,
  Sanitized,
  Style
} from './types'
import throwWindowError from './utils'

const generator: Generator<number> = generate()

export default class FiCsElement<D extends object, P extends object> {
  readonly #name: string
  readonly #reservedWords: Record<string, true> = { var: true, router: true, link: true }
  readonly #ficsIdName: string = 'fics-id'
  readonly #ficsId: string
  readonly #tagName: string
  readonly #isImmutable: boolean = false
  readonly #data: D = {} as D
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
  readonly #html: Html<D, P>
  readonly #showAttr: string
  readonly #css: Css<D, P> = new Array()
  readonly #actions: Action<D, P>[] = new Array()
  readonly #hooks: Hooks<D, P> = {} as Hooks<D, P>
  readonly #propsTrees: PropsTree<D, P>[] = new Array()
  readonly #descendants: Record<string, FiCsElement<D, P>> = {}
  readonly #varTag = 'f-var'
  readonly #newElements: Set<Element> = new Set()
  readonly #components: Set<HTMLElement> = new Set()
  #propsChain: PropsChain<P> = new Map()
  #isReflecting: boolean = false

  constructor({
    name,
    isExceptional,
    isImmutable,
    data,
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
    this.#name = this.#convertStr(name, 'kebab')

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

      if (data)
        for (const [key, value] of Object.entries(data())) this.#data[key as keyof D] = value

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

      this.#html = html
      this.#showAttr = `${this.#ficsId}-show-syntax`

      if (css && css.length > 0) this.#css = [...css]
      if (actions && actions.length > 0) this.#actions = [...actions]
      if (hooks) this.#hooks = { ...hooks }
    }
  }

  #convertStr(str: string, type: 'kebab' | 'camel'): string {
    if (type === 'kebab') return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    return str.toLowerCase().replaceAll(/-([a-z])/g, (_, char) => char.toUpperCase())
  }

  #setDataMethods(): DataMethods<D> {
    return {
      $setData: (key: keyof D, value: D[typeof key]): void => this.setData(key, value),
      $getData: (key: keyof D): D[typeof key] => this.getData(key)
    }
  }

  #setProps(key: keyof P, value: P[typeof key]): void {
    if (!(key in this.#props)) throw new Error(`"${key as string}" is not defined in props...`)
    else if (this.#props[key] !== value) {
      this.#props[key] = value
      addToQueue({ ficsId: this.#ficsId, func: () => this.#reRender() })
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

          const descendantId: string = descendant.#ficsId

          for (const [key, value] of Object.entries(values({ ...this.#setDataMethods() }))) {
            const chain: Record<string, P> = propsChain.get(descendantId) ?? {}

            if (key in chain && propsChain.has(descendantId)) continue

            propsChain.set(descendantId, { ...chain, [key]: value })

            const last: number = this.#propsTrees.length - 1
            const tree: PropsTree<D, P> = {
              numberId: parseInt(descendantId.replace(new RegExp(`^${this.#ficsIdName}`), '')),
              dataKey: key as keyof D,
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

  #addClassName(component: HTMLElement): void {
    if (this.#className)
      component.setAttribute(
        'class',
        typeof this.#className === 'function'
          ? this.#className(this.#setDataProps())
          : (this.#className ?? '')
      )
  }

  #addAttrs(component: HTMLElement): void {
    for (const [key, value] of Object.entries(
      typeof this.#attrs === 'function' ? this.#attrs(this.#setDataProps()) : (this.#attrs ?? [])
    ))
      component.setAttribute(this.#convertStr(key, 'kebab'), value)
  }

  #getChildNodes(parent: DocumentFragment | ChildNode): ChildNode[] {
    return Array.from(parent.childNodes)
  }

  #isVarTag(element: Element): boolean {
    return element.localName === this.#varTag
  }

  #getFiCsId(element: Element, isProperty?: boolean): string | null {
    return isProperty
      ? (element as any)[this.#convertStr(this.#ficsIdName, 'camel')]
      : element.getAttribute(this.#ficsIdName)
  }

  #render = (element: Element, doc?: Document): HTMLElement => {
    const ficsId: string | null = this.#getFiCsId(element)
    if (!ficsId) throw new Error(`The child FiCsElement has ficsId does not exist...`)

    const descendant: FiCsElement<D, P> = this.#descendants[ficsId]

    if (doc) return descendant.#renderOnServer(doc, this.#propsChain)

    addToQueue({ ficsId: descendant.#ficsId, func: () => descendant.#define(this.#propsChain) })
    return descendant.#getComponent()
  }

  #getHtml(doc?: Document): ChildNode[] {
    const sanitized: unique symbol = Symbol(`${this.#ficsId}-sanitized`)
    const unsanitized: unique symbol = Symbol(`${this.#ficsId}-unsanitized`)

    const convertTemplate = (
      templates: TemplateStringsArray,
      variables: (HtmlContent<D, P> | unknown)[]
    ): HtmlContent<D, P>[] => {
      const isSymbol = (param: unknown, symbol: symbol): boolean =>
        !!(param && typeof param === 'object' && symbol in param)
      const converted: HtmlContent<D, P>[] = new Array()

      const sanitize = (index: number, template: string, variable: unknown): void => {
        if (isSymbol(variable, sanitized))
          converted.push(template, ...(variable as Sanitized<D, P>)[sanitized])
        else if (Array.isArray(variable)) {
          converted.push(template)
          for (const child of variable) sanitize(index, '', child)
        } else if (isSymbol(variable, unsanitized))
          converted.push(template, (variable as Record<symbol, string>)[unsanitized])
        else {
          if (template !== '') converted.push(template)

          variable =
            typeof variable === 'string'
              ? variable.replaceAll(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
              : (variable ?? '')

          if (variable !== '') converted.push(variable as HtmlContent<D, P>)
        }
      }

      for (const [index, template] of templates.entries())
        sanitize(index, template, variables[index])

      return converted as HtmlContent<D, P>[]
    }

    const $i18n: ({ json, lang, keys }: I18n) => string = ({ json, lang, keys }: I18n): string => {
      let texts: Record<string, string> | string = json[lang]
      if (!texts) throw new Error(`${lang}.json does not exist...`)

      for (const key of Array.isArray(keys) ? keys : [keys])
        if (typeof texts === 'object' && texts !== null && key in texts) texts = texts[key]

      if (typeof texts === 'string') return texts
      throw new Error(`There is no applicable value in json..`)
    }

    const contents: HtmlContent<D, P>[] = this.#html({
      ...this.#setDataProps(),
      $template: (
        templates: TemplateStringsArray,
        ...variables: (HtmlContent<D, P> | unknown)[]
      ): Sanitized<D, P> => ({ [sanitized]: convertTemplate(templates, variables) }),
      $html: (str: string): Record<symbol, string> => ({ [unsanitized]: str }),
      $show: (condition: boolean): string => (condition ? '' : this.#showAttr),
      $i18n
    })[sanitized]

    const html: string = contents.reduce((prev, curr) => {
      if (curr instanceof FiCsElement) {
        if (!(curr.#ficsId in this.#descendants)) this.#descendants[curr.#ficsId] = curr
        curr = `<${this.#varTag} ${this.#ficsIdName}="${curr.#ficsId}"></${this.#varTag}>`
      }

      return `${prev}${curr}`
    }, '') as string
    const childNodes: ChildNode[] = this.#getChildNodes(
      (doc ?? document).createRange().createContextualFragment(html)
    )

    const convertChildNodes = (childNodes: ChildNode[]): void => {
      for (let index = 0; index < childNodes.length; index++) {
        const childNode: ChildNode = childNodes[index]

        if (childNode instanceof Text && (childNode.nodeValue ?? '').trim() === '') {
          childNode.parentNode?.removeChild(childNode)
          childNodes.splice(index, 1)
          index--
          continue
        }

        if (childNode instanceof Element) {
          if (this.#isVarTag(childNode)) {
            const component: HTMLElement = this.#render(childNode, doc)
            childNode.replaceWith(component)
            childNodes.splice(index, 1, component)
            index--
            continue
          }

          if (childNode.hasAttribute(this.#showAttr)) {
            ;(childNode as HTMLElement).style.display = 'none'
            childNode.removeAttribute(this.#showAttr)
          }
        }

        convertChildNodes(this.#getChildNodes(childNode))
      }
    }

    convertChildNodes(childNodes)
    return childNodes
  }

  #getCss({ css, host, mode }: { css: Css<D, P>; host: string; mode: 'csr' | 'ssr' }): string {
    if (css.length === 0) return ''

    const createCss = (param: Style<D, P>): string => {
      if (param[mode] === false) return ''

      const entries: [string, unknown][] = Object.entries(
        typeof param.style === 'function' ? param.style(this.#setDataProps()) : param.style
      )
      const content: string = entries
        .map(([key, value]) => {
          key = this.#convertStr(key, 'kebab')
          if (key.startsWith('webkit')) key = `-${key}`

          return `${key}: ${value};`
        })
        .join('\n')

      return `${host} ${param.selector ?? ''}{${content}}`
    }

    return css.reduce((prev, curr) => {
      if (typeof curr !== 'string' && 'style' in curr) curr = ` ${createCss(curr)}`

      return `${prev}${curr}`
    }, '') as string
  }

  #renderOnServer(doc: Document, propsChain: PropsChain<P>): HTMLElement {
    addToQueue({ ficsId: this.#ficsId, func: () => this.#define() })
    const component: HTMLElement = doc.createElement(this.#tagName)

    if (!this.#isOnlyCsr) {
      this.#initProps(propsChain)
      this.#addClassName(component)
      this.#addAttrs(component)
      component.setHTMLUnsafe(
        `<template shadowrootmode="open"><slot name="${this.#ficsId}"></slot></template>`
      )

      const div: HTMLElement = doc.createElement('div')
      div.id = this.#ficsId
      div.slot = this.#ficsId
      component.append(div)

      for (const childNode of this.#getHtml(doc)) div.append(childNode)

      if (this.#css.length > 0)
        div.insertAdjacentHTML(
          'beforeend',
          `<style>${this.#getCss({ css: this.#css, host: `#${this.#ficsId}`, mode: 'ssr' })}</style>`
        )
    }

    return component
  }

  #removeChildNodes(param: HTMLElement | ChildNode[]): void {
    for (const childNode of param instanceof HTMLElement ? this.#getChildNodes(param) : param)
      childNode.remove()
  }

  #setProperty<V>(element: HTMLElement, property: string, value: V): void {
    ;(element as any)[this.#convertStr(property, 'camel')] = value
  }

  #addHtml(shadowRoot: ShadowRoot): void {
    const oldChildNodes: ChildNode[] = this.#getChildNodes(shadowRoot)
    const newChildNodes: ChildNode[] = this.#getHtml()

    if (oldChildNodes.length === 0)
      for (const childNode of newChildNodes) shadowRoot.append(childNode)
    else if (newChildNodes.length === 0) this.#removeChildNodes(oldChildNodes)
    else {
      const that: FiCsElement<D, P> = this
      let { activeElement }: { activeElement: Element | null } = shadowRoot

      const getKey = (element: Element): string | null => element.getAttribute('key')
      const matchChildNode = (oldChildNode: ChildNode, newChildNode: ChildNode): boolean => {
        const isSameNode: boolean = oldChildNode.nodeName === newChildNode.nodeName

        if (oldChildNode instanceof Element && newChildNode instanceof Element) {
          const isSameFiCsId: boolean =
            this.#isVarTag(newChildNode) &&
            this.#getFiCsId(oldChildNode, true) === this.#getFiCsId(newChildNode)
          const isSameKey: boolean = getKey(oldChildNode) === getKey(newChildNode)

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
          !that.#isVarTag(newChildNode)
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
        let oldStartIndex: number = 0
        let oldEndIndex: number = oldChildNodes.length - 1
        let oldStartNode: ChildNode = oldChildNodes[oldStartIndex]
        let oldEndNode: ChildNode = oldChildNodes[oldEndIndex]
        let newStartIndex: number = 0
        let newEndIndex: number = newChildNodes.length - 1
        let newStartNode: ChildNode = newChildNodes[newStartIndex]
        let newEndNode: ChildNode = newChildNodes[newEndIndex]
        const keys: Record<string, true> = {}

        for (const newChildNode of newChildNodes) {
          if (!(newChildNode instanceof Element) || that.#isVarTag(newChildNode)) continue

          const { localName }: { localName: string } = newChildNode
          const key: string = getKey(newChildNode) ?? localName

          if (keys[key])
            console.warn(
              (newChildNode.hasAttribute('key')
                ? `The key "${key}" in multiple ${localName} elements are duplicated.`
                : `There are multiple ${localName} elements that don't have keys.`) +
                ' therefore, the difference detection might not be working correctly...'
            )
          else keys[key] = true
        }

        const dom: Map<string, ChildNode[]> = new Map()
        const keyChildNodes: Map<string, ChildNode> = new Map()

        const insertBefore = (childNode: ChildNode, before: ChildNode | null): void => {
          if (childNode instanceof Element)
            if (that.#isVarTag(childNode)) childNode = that.#render(childNode)
            else that.#newElements.add(childNode)

          if (before instanceof Element && that.#isVarTag(before)) before = that.#render(before)

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
          const key: string | null = childNode instanceof Element ? getKey(childNode) : null

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
            if (dom.size === 0)
              for (const oldChildNode of oldChildNodes) {
                if (oldChildNode instanceof Element && !!that.#getFiCsId(oldChildNode, true))
                  continue

                const mapKey: string = getMapKey(oldChildNode)
                dom.set(mapKey, [...(dom.get(mapKey) ?? []), oldChildNode])
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
    shadowRoot.adoptedStyleSheets = [stylesheet]
    stylesheet.replaceSync(
      this.#getCss({
        css: css.length > 0 ? Array.from(new Set([...this.#css, ...css])) : this.#css,
        host: ':host',
        mode: 'csr'
      })
    )
  }

  #getShadowRoot(component: HTMLElement): ShadowRoot {
    if (component.shadowRoot) return component.shadowRoot

    throw new Error(`${this.#tagName} does not have shadowRoot...`)
  }

  #getElements(shadowRoot: ShadowRoot, selector: string): Element[] {
    return Array.from(shadowRoot.querySelectorAll(`:host ${selector}`))
  }

  #addEventListener(
    element: Element,
    handler: string,
    method: Method<D, P>,
    enterKey?: boolean
  ): void {
    const attrs: Record<string, string> = {}

    for (let index = 0; index < element.attributes.length; index++) {
      const { name, value } = element.attributes[index]
      attrs[name] = value
    }

    const getMethodParams = (event: Event): MethodParams<D, P> => ({
      ...this.#setDataProps(),
      ...this.#setDataMethods(),
      $event: event,
      $attributes: attrs,
      $value:
        element instanceof
        (HTMLInputElement ||
          HTMLTextAreaElement ||
          HTMLOptionElement ||
          HTMLProgressElement ||
          HTMLMeterElement)
          ? element.value
          : undefined
    })

    element.addEventListener(handler, (event: Event): void => method(getMethodParams(event)))

    if (handler === 'click' && enterKey)
      element.addEventListener('keydown', (event: Event): void => {
        const { key }: { key: string } = event as KeyboardEvent

        if (key === 'Enter') method(getMethodParams(event))
      })
  }

  #callback(key: Exclude<keyof Hooks<D, P>, 'updated'>): void {
    this.#hooks[key]?.({ ...this.#setDataProps(), ...this.#setDataMethods() })
  }

  #getComponent(): HTMLElement {
    const component: HTMLElement = document.createElement(this.#tagName)
    this.#callback('created')

    return component
  }

  #define(propsChain?: PropsChain<P>): void {
    throwWindowError()

    if (!window.customElements.get(this.#tagName)) {
      const that: FiCsElement<D, P> = this

      window.customElements.define(
        that.#tagName,
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
            that.#initProps(propsChain ?? that.#propsChain)
            that.#addClassName(this)
            that.#addAttrs(this)
            that.#addHtml(this.shadowRoot)
            that.#addCss(this.shadowRoot)

            if (that.#actions.length > 0)
              for (const action of that.#actions) {
                const { handler, selector, method, enterKey }: Action<D, P> = action

                if (!that.#isImmutable && selector) {
                  that.#bindings.actions.push(action)

                  for (const element of that.#getElements(that.#getShadowRoot(this), selector))
                    that.#addEventListener(element, handler, method, enterKey)
                } else that.#addEventListener(this, handler, method, enterKey)
              }

            that.#removeChildNodes(this)
            that.#setProperty(this, that.#ficsIdName, that.#ficsId)
            that.#components.add(this)
          }

          connectedCallback(): void {
            that.#callback('mounted')
          }

          disconnectedCallback(): void {
            that.#callback('destroyed')
          }

          adoptedCallback(): void {
            that.#callback('adopted')
          }
        }
      )
    }
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

      if (this.#bindings.css.length > 0)
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

  getServerComponent(doc: Document): string {
    this.#callback('created')
    return this.#renderOnServer(doc, this.#propsChain).outerHTML
  }

  ssr(parent: HTMLElement, position: 'before' | 'after' = 'after'): void {
    const temporary: HTMLElement = document.createElement(this.#varTag)
    temporary.setHTMLUnsafe(this.getServerComponent(document))

    parent.insertBefore(
      temporary,
      position === 'before' ? parent.firstChild : (parent.lastChild?.nextSibling ?? null)
    )
    parent.insertBefore(temporary.firstChild!, temporary)
    temporary.remove()
  }

  describe(parent?: HTMLElement): void {
    addToQueue({ ficsId: this.#ficsId, func: () => this.#define() })

    if (parent) parent.append(this.#getComponent())
  }

  getData = <K extends keyof D>(key: K): D[typeof key] => {
    if (key in this.#data) return this.#data[key]

    throw new Error(`"${key as string}" is not defined in data...`)
  }

  setData(key: keyof D, value: D[typeof key]): void {
    if (this.#isReflecting) throw new Error(`"${key as string}" is not changed in reflections...`)
    else if (!(key in this.#data)) throw new Error(`"${key as string}" is not defined in data...`)
    else if (this.#data[key] !== value) {
      this.#data[key] = value
      addToQueue({ ficsId: this.#ficsId, func: () => this.#reRender() })

      for (const { dataKey, setProps } of this.#propsTrees)
        if (dataKey === key) setProps(value as unknown as P[keyof P])

      if (this.#hooks.updated) {
        if (!(key in this.#data)) throw new Error(`"${String(key)}" is not defined in data...`)

        this.#isReflecting = true
        this.#hooks.updated[key]?.({ ...this.#setDataMethods(), $dataValue: this.#data[key] })
        this.#isReflecting = false
      }
    }
  }
}
