import { getGlobalCss } from './globalCss'
import { convertToArray, generateUid, throwDataPropsError, throwWindowError } from './helpers'
import enqueue from './queue'
import type {
  Action,
  Attrs,
  Bindings,
  ClassName,
  Css,
  CssContent,
  DataMethods,
  DataParams,
  DataProps,
  FiCs,
  GlobalCssContent,
  Html,
  HtmlContent,
  Hooks,
  Options,
  PollingOptions,
  Props,
  PropsChain,
  PropsTree,
  Queue,
  Sanitized,
  SingleOrArray
} from './types'

const generator: Generator<number> = generateUid()

export default class FiCsElement<D extends object, P extends object> {
  readonly #name: string
  readonly #reservedWords: Record<string, true> = {
    var: true,
    await: true,
    router: true,
    link: true
  }
  readonly #ficsIdName: string = 'fics-id'
  readonly #ficsId: string
  readonly #tagName: string
  readonly #data: D = {} as D
  readonly #inheritances: Props<D, P>[] = new Array()
  readonly #props: P = {} as P
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
  readonly #options: Options = { immutable: false, ssr: true, lazyLoad: false, rootMargin: '0px' }
  readonly #propsTrees: PropsTree<D, P>[] = new Array()
  readonly #descendants: Record<string, FiCsElement<D, P>> = {}
  readonly #varTag = 'f-var'
  readonly #newElements: Set<Element> = new Set()
  readonly #components: Set<HTMLElement> = new Set()
  #isInitialized: boolean = false
  #propsChain: PropsChain<P> = new Map()
  #isReflecting: boolean = false

  constructor({
    name,
    isExceptional,
    data,
    props,
    className,
    attributes,
    html,
    css,
    actions,
    hooks,
    options
  }: FiCs<D, P>) {
    this.#name = this.#convertStr(name, 'kebab')

    if (!isExceptional && this.#reservedWords[this.#name])
      throw new Error(`"${name}" is a reserved word in FiCsJS...`)

    this.#ficsId = `${this.#ficsIdName}${generator.next().value}`
    this.#tagName = `f-${this.#name}`

    if (options) {
      const { immutable, ssr, lazyLoad, rootMargin }: Options = options

      if (immutable) {
        if (data)
          throw new Error(`${this.#tagName} is an immutable component, so it cannot define data...`)

        this.#options.immutable = immutable
      }

      if (ssr === false) this.#options.ssr = false
      if (lazyLoad) this.#options.lazyLoad = true

      if (rootMargin) {
        if (!lazyLoad)
          throw new Error(`"rootMargin" in options is enabled only if "lazyLoad" is set to true...`)

        this.#options.rootMargin = rootMargin
      }
    }

    if (data) for (const [key, value] of Object.entries(data())) this.#data[key as keyof D] = value
    if (props) this.#inheritances = convertToArray(props)

    if (className) {
      if (!this.#options.immutable && typeof className === 'function')
        this.#bindings.isClassName = true

      this.#className = className
    }

    if (attributes) {
      if (!this.#options.immutable && typeof attributes === 'function') this.#bindings.isAttr = true

      this.#attrs = attributes
    }

    this.#html = html
    this.#showAttr = `${this.#ficsId}-show-syntax`

    if (css) this.#css = convertToArray(css)
    if (actions) this.#actions = [...actions]
    if (hooks) this.#hooks = { ...hooks }
  }

  #convertStr(str: string, type: 'kebab' | 'camel'): string {
    if (type === 'kebab') return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    return str.toLowerCase().replaceAll(/-([a-z])/g, (_, char) => char.toUpperCase())
  }

  #setDataMethods(): DataMethods<D> {
    return {
      $setData: <K extends keyof D>(key: K, value: D[K]): void => this.setData(key, value),
      $getData: <K extends keyof D>(key: K): D[K] => this.getData(key)
    }
  }

  #enqueue(func: () => void, key: Queue['key']): void {
    enqueue({ ficsId: this.#ficsId, func, key })
  }

  #setProps(key: keyof P, value: P[typeof key]): void {
    throwDataPropsError(this.#props, key, this.#tagName)

    if (this.#props[key] !== value) {
      this.#props[key] = value
      this.#enqueue(() => this.#reRender(), 're-render')
    }
  }

  #initProps(propsChain: PropsChain<P>): void {
    if (!this.#isInitialized) {
      for (const [key, value] of Object.entries(propsChain.get(this.#ficsId) ?? {}))
        this.#props[key as keyof P] = value as P[keyof P]

      if (this.#inheritances.length > 0)
        for (const { descendant, values } of this.#inheritances)
          for (const _descendant of Array.isArray(descendant) ? descendant : [descendant]) {
            if (_descendant.#options.immutable)
              throw new Error(
                `${this.#tagName} is an immutable component, so it cannot receive props...`
              )

            const descendantId: string = _descendant.#ficsId

            for (const [key, value] of Object.entries(
              values({ ...this.#setDataMethods(), $props: { ...this.#props } })
            )) {
              const chain: Record<string, P> = propsChain.get(descendantId) ?? {}

              if (key in chain && propsChain.has(descendantId)) continue

              propsChain.set(descendantId, { ...chain, [key]: value })

              const last: number = this.#propsTrees.length - 1
              const tree: PropsTree<D, P> = {
                numberId: parseInt(descendantId.replace(new RegExp(`^${this.#ficsIdName}`), '')),
                dataKey: key as keyof D,
                setProps: (value: P[keyof P]): void => _descendant.#setProps(key, value)
              }
              const isExLargerNumberId = (index: number): boolean =>
                this.#propsTrees[index].numberId >= tree.numberId

              if (last > 2) {
                let min: number = 0
                let max: number = last

                while (min <= max) {
                  const mid: number = Math.floor((min + max) / 2)
                  isExLargerNumberId(mid) ? (min = mid + 1) : (max = mid - 1)
                }

                this.#propsTrees.splice(min, 0, tree)
              } else
                this.#propsTrees[last < 0 || isExLargerNumberId(last) ? 'push' : 'unshift'](tree)
            }
          }

      this.#propsChain = new Map(propsChain)
      this.#isInitialized = true
    }
  }

  #setDataProps(): DataProps<D, P> {
    return this.#options.immutable
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

  #render(element: Element, doc?: Document): HTMLElement {
    const ficsId: string | null = this.#getFiCsId(element)
    if (!ficsId) throw new Error(`The ${element} has ficsId does not exist in ${this.#tagName}...`)

    const descendant: FiCsElement<D, P> = this.#descendants[ficsId]

    if (doc) return descendant.#renderOnServer(doc, this.#propsChain)

    descendant.#enqueue(() => descendant.#define(this.#propsChain), 'define')
    return document.createElement(descendant.#tagName)
  }

  #convertTemplate(doc?: Document): ChildNode[] {
    const sanitized: unique symbol = Symbol(`${this.#ficsId}-sanitized`)
    const unsanitized: unique symbol = Symbol(`${this.#ficsId}-unsanitized`)

    const convertSyntaxes = (
      templates: TemplateStringsArray,
      variables: (HtmlContent<D, P> | unknown)[]
    ): HtmlContent<D, P>[] => {
      const isSymbol = (variable: unknown, symbol: symbol): boolean =>
        !!(variable && typeof variable === 'object' && symbol in variable)
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

    const contents: HtmlContent<D, P>[] = this.#html({
      ...this.#setDataProps(),
      $template: (
        templates: TemplateStringsArray,
        ...variables: (HtmlContent<D, P> | unknown)[]
      ): Sanitized<D, P> => ({ [sanitized]: convertSyntaxes(templates, variables) }),
      $html: (str: string): Record<symbol, string> => ({ [unsanitized]: str }),
      $show: (condition: boolean): string => (condition ? '' : this.#showAttr)
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

  #convertCss({ css, host, mode }: { css: Css<D, P>; host: string; mode: 'csr' | 'ssr' }): string {
    if (css.length === 0) return ''

    const createCss = (css: Css<D, P>, host: string): string =>
      css.reduce((prev, curr) => {
        if (typeof curr === 'string') return `${prev}${curr}`

        const selector: SingleOrArray = curr.selector ?? ''
        const createCssContent = (host: string): string => {
          if (curr[mode] === false) return ''

          const entries: [string, string | number | undefined][] = Object.entries(
            typeof curr.style === 'function' ? curr.style(this.#setDataProps()) : curr.style
          )
          const content: string = entries
            .map(([key, value]) => {
              if (value === undefined) return ''

              key = this.#convertStr(key, 'kebab')

              if (key.startsWith(':host'))
                console.warn(`The ':host' selector might not be necessary in ${key}...`)
              else if (key.startsWith('webkit')) key = `-${key}`

              return `${key}: ${value};`
            })
            .join('\n')

          const processPseudoClass = (selector: string): string =>
            selector.startsWith(':') ? selector : ` ${selector}`

          if (Array.isArray(selector))
            return selector.reduce(
              (prev, curr) => `${prev} ${host}${processPseudoClass(curr)}{${content}}`,
              ''
            )

          return `${host}${processPseudoClass(selector)}{${content}}`
        }
        const { nested }: { nested?: SingleOrArray<CssContent<D, P> | GlobalCssContent> } = curr
        const css: string = `${prev} ${createCssContent(host)}`

        if (!nested) return css

        return convertToArray(selector).reduce(
          (prev, curr) => prev + createCss(convertToArray(nested), `${host} ${curr}`),
          css
        )
      }, '') as string

    return createCss(css, host)
  }

  #callback(key: Exclude<keyof Hooks<D, P>, 'updated'>): void {
    const params: DataParams<D, P> = { ...this.#setDataProps(), ...this.#setDataMethods() }

    if (key !== 'mounted') this.#hooks[key]?.(params)
    else {
      const poll = (
        func: ({ $times }: { $times: number }) => void,
        { interval, max, exit }: PollingOptions
      ): void => {
        let times = 0

        const execute: NodeJS.Timeout = setTimeout(function run() {
          if ((max && times >= max) || (exit && exit())) {
            clearTimeout(execute)
            return
          }

          func({ $times: times })
          times++
          setTimeout(run, interval)
        }, interval)
      }

      this.#hooks[key]?.({ ...params, $poll: poll })
    }
  }

  #renderOnServer(doc: Document, propsChain: PropsChain<P>): HTMLElement {
    const component: HTMLElement = doc.createElement(this.#tagName)
    this.#initProps(propsChain)
    this.#callback('created')

    if (!this.#options.ssr && !this.#options.lazyLoad) {
      this.#addClassName(component)
      this.#addAttrs(component)
      component.setHTMLUnsafe(
        `<template shadowrootmode="open"><slot name="${this.#ficsId}"></slot></template>`
      )

      const div: HTMLElement = doc.createElement('div')
      div.id = this.#ficsId
      div.slot = this.#ficsId
      for (const childNode of this.#convertTemplate(doc)) div.append(childNode)
      component.append(div)

      const allCss: Css<D, P> = [...getGlobalCss(), ...this.#css]

      if (allCss.length > 0)
        div.insertAdjacentHTML(
          'beforeend',
          `<style>${this.#convertCss({ css: allCss, host: `#${this.#ficsId}`, mode: 'ssr' })}</style>`
        )
    }

    this.#enqueue(() => this.#define(), 'define')
    return component
  }

  #removeChildNodes(target: HTMLElement | ChildNode[]): void {
    for (const childNode of target instanceof HTMLElement ? this.#getChildNodes(target) : target)
      childNode.remove()
  }

  #setProperty<V>(element: HTMLElement, property: string, value: V): void {
    ;(element as any)[this.#convertStr(property, 'camel')] = value
  }

  #addHtml(shadowRoot: ShadowRoot): void {
    const oldChildNodes: ChildNode[] = this.#getChildNodes(shadowRoot)
    const newChildNodes: ChildNode[] = this.#convertTemplate()

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
            const { name, value }: { name: string; value: string } = oldAttrs[index]
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

  #addCss(shadowRoot: ShadowRoot, css?: Css<D, P>): void {
    const allCss: Css<D, P> = [...getGlobalCss(), ...this.#css]

    if (allCss.length === 0) return

    if (!this.#options.immutable && !css) {
      const bindNestedCss = (
        parentIndex: number,
        nested?: SingleOrArray<CssContent<D, P> | GlobalCssContent>
      ): void => {
        if (nested)
          for (const [index, content] of convertToArray(nested).entries()) {
            if (typeof content.style === 'function') {
              if (!this.#bindings.css[parentIndex])
                this.#bindings.css[parentIndex] = { index: parentIndex, nested: [] }

              this.#bindings.css[parentIndex].nested?.push({ index })
            }

            bindNestedCss(index, (content as CssContent<D, P>).nested)
          }
      }

      for (const [index, content] of this.#css.entries()) {
        if (typeof content === 'string') continue

        if (typeof content.style === 'function') this.#bindings.css.push({ index })

        bindNestedCss(index, content.nested)
      }
    }

    const stylesheet: CSSStyleSheet = new CSSStyleSheet()
    shadowRoot.adoptedStyleSheets = [stylesheet]
    stylesheet.replaceSync(this.#convertCss({ css: allCss, host: ':host', mode: 'csr' }))
  }

  #getShadowRoot(component: HTMLElement): ShadowRoot {
    if (component.shadowRoot) return component.shadowRoot

    throw new Error(`${this.#tagName} does not have shadowRoot...`)
  }

  #getElements(shadowRoot: ShadowRoot, selector: string): Element[] {
    return Array.from(shadowRoot.querySelectorAll(`:host ${selector}`))
  }

  #debounce<T extends (...args: any[]) => void>(
    func: T,
    time: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | undefined

    return (...args: Parameters<T>): void => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), time)
    }
  }

  #throttle<T extends (...args: any[]) => void>(
    func: T,
    time: number
  ): (...args: Parameters<T>) => void {
    let lastTime: number = 0

    return (...args: Parameters<T>): void => {
      const now: number = Date.now()

      if (now - lastTime >= time) {
        lastTime = now
        func(...args)
      }
    }
  }

  #addEventListener(
    element: Element,
    handler: string,
    method: Action<D, P>['method'],
    options?: Action<D, P>['options']
  ): void {
    if (handler !== 'click' && options?.blur)
      throw new Error('The "blur" is enabled only if the handler is click...')

    const attrs: Record<string, string> = {}

    for (let index = 0; index < element.attributes.length; index++) {
      const { name, value }: { name: string; value: string } = element.attributes[index]
      attrs[name] = value
    }

    const { debounce, throttle }: { debounce?: number; throttle?: number } = options ?? {}

    if (debounce && throttle)
      throw new Error('Debounce and throttle cannot be used together in the same event handler.')

    const callback = (event: Event): void => {
      method({
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

      if (options?.blur) (event.target as HTMLElement).blur()
    }

    element.addEventListener(
      handler,
      debounce
        ? this.#debounce(callback, debounce)
        : throttle
          ? this.#throttle(callback, throttle)
          : callback,
      { once: options?.once }
    )
  }

  #define(propsChain?: PropsChain<P>): void {
    throwWindowError()

    if (!window.customElements.get(this.#tagName)) {
      const that: FiCsElement<D, P> = this
      const { immutable, lazyLoad, rootMargin }: Options = that.#options

      window.customElements.define(
        that.#tagName,
        class extends HTMLElement {
          readonly shadowRoot: ShadowRoot
          isRendered: boolean = false

          constructor() {
            super()
            this.shadowRoot = this.attachShadow({ mode: 'open' })
            if (!lazyLoad) this.#init()
          }

          #init() {
            that.#initProps(propsChain ?? that.#propsChain)
            that.#addClassName(this)
            that.#addAttrs(this)
            that.#addHtml(this.shadowRoot)
            that.#addCss(this.shadowRoot)

            if (that.#actions.length > 0)
              for (const action of that.#actions) {
                const { handler, selector, method, options }: Action<D, P> = action

                if (!immutable && selector) {
                  that.#bindings.actions.push(action)

                  for (const element of that.#getElements(that.#getShadowRoot(this), selector))
                    that.#addEventListener(element, handler, method, options)
                } else that.#addEventListener(this, handler, method, options)
              }

            that.#removeChildNodes(this)
            that.#setProperty(this, that.#ficsIdName, that.#ficsId)
            that.#components.add(this)
          }

          connectedCallback(): void {
            if (lazyLoad) {
              const observer: IntersectionObserver = new IntersectionObserver(
                ([entry]) => {
                  if (entry.isIntersecting) {
                    that.#enqueue(() => this.#init(), 'init')
                    observer.unobserve(entry.target)
                  }
                },
                { rootMargin }
              )

              observer.observe(this)
            }

            if (!this.isRendered) {
              that.#callback('mounted')
              this.isRendered = true
            }
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

      if (css.length > 0) {
        const renewedCss: Css<D, P> = []

        const getRenewedCss = (css: Bindings<D, P>['css']): void => {
          for (const { index, nested } of css) {
            if (index >= 0) renewedCss.push(this.#css[index])
            if (nested) getRenewedCss(nested)
          }
        }

        getRenewedCss(css)
        this.#addCss(shadowRoot, renewedCss.length > 0 ? renewedCss : undefined)
      }

      if (actions.length > 0)
        for (const action of actions) {
          const { handler, selector, method, options }: Action<D, P> = action

          if (selector)
            for (const element of this.#getElements(shadowRoot, selector))
              if (this.#newElements.has(element))
                this.#addEventListener(element, handler, method, options)
        }

      this.#newElements.clear()
    }
  }

  getServerComponent(doc: Document): string {
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
    this.#callback('created')
    this.#enqueue(() => this.#define(), 'define')
    if (parent) parent.append(document.createElement(this.#tagName))
  }

  setData<K extends keyof D>(key: K, value: D[K]): void {
    if (this.#isReflecting)
      throw new Error(
        `"${key as string}" cannot be not changed in updated hook of ${this.#tagName}...`
      )

    throwDataPropsError(this.#data, key, this.#tagName)

    if (this.#data[key] !== value) {
      this.#data[key] = value
      this.#enqueue(() => this.#reRender(), 're-render')

      for (const { dataKey, setProps } of this.#propsTrees)
        if (dataKey === key) setProps(value as unknown as P[keyof P])

      if (this.#hooks.updated) {
        throwDataPropsError(this.#data, key, this.#tagName)
        this.#isReflecting = true
        this.#hooks.updated[key]?.({ ...this.#setDataMethods(), $dataValue: this.#data[key] })
        this.#isReflecting = false
      }
    }
  }

  getData<K extends keyof D>(key: K): D[K] {
    throwDataPropsError(this.#data, key, this.#tagName)
    return this.#data[key]
  }
}
