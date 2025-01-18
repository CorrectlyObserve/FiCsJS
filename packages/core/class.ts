import { getGlobalCss } from './globalCss'
import { convertToArray, generateUid, throwWindowError } from './helpers'
import { enqueue } from './queue'
import type {
  Actions,
  ActionOptions,
  Attrs,
  Bindings,
  ClassName,
  Css,
  DataProps,
  DataPropsMethods,
  Descendant,
  FiCs,
  Html,
  HtmlContent,
  Hooks,
  Method,
  Options,
  PollingOptions,
  Props,
  PropsChain,
  PropsTree,
  Queue,
  Sanitized,
  Style
} from './types'

const names: Record<string, number> = {}
const generator: Generator<number> = generateUid()

export default class FiCsElement<D extends object, P extends object> {
  readonly #ficsIdName: string = 'fics-id'
  readonly #ficsId: string
  readonly #name: string
  readonly #data: D = {} as D
  readonly #fetch?: (dataProps: DataProps<D, P>) => Promise<Partial<D>>
  readonly #propsSources: Props<D, P>[] = new Array()
  readonly #props: P = {} as P
  readonly #bindings: Bindings = { isClassName: false, isAttr: false, css: new Array() }
  readonly #className?: ClassName<D, P>
  readonly #attrs?: Attrs<D, P>
  readonly #html: Html<D, P>
  readonly #showAttr: string
  readonly #css: Css<D, P>[] = new Array()
  readonly #actions: Actions<D, P> = {}
  readonly #hooks: Hooks<D, P> = {} as Hooks<D, P>
  readonly #options: Options = { ssr: true, lazyLoad: false, rootMargin: '0px' }
  readonly #propsTrees: PropsTree[] = new Array()
  readonly #descendants: Record<string, FiCsElement<D, P>> = {}
  readonly #varTag = 'f-var'
  readonly #newElements: Set<Element> = new Set()
  readonly #components: Set<HTMLElement> = new Set()
  #isLoaded?: boolean
  #isInitialized: boolean = false
  #propsChain: PropsChain<P> = new Map()

  constructor({
    name,
    isExceptional,
    data,
    fetch,
    props,
    className,
    attributes,
    html,
    css,
    clonedCss,
    actions,
    hooks,
    options
  }: FiCs<D, P>) {
    name = name.trim()
    if (name === '') throw new Error('The FiCsElement name cannot be empty....')
    name = this.#convertStr(name, 'kebab')

    if (!isExceptional && { var: true, router: true }[name])
      throw new Error(`The "${name}" is a reserved word in FiCsJS...`)

    this.#ficsId = `${this.#ficsIdName}${generator.next().value}`

    names[name] ? names[name]++ : (names[name] = 1)
    this.#name = `f-${name}${names[name] > 1 ? `-${names[name]}` : ''}`

    if (options) {
      const { ssr, lazyLoad, rootMargin }: Options = options

      if (ssr === false || lazyLoad) this.#options.ssr = false
      if (lazyLoad) this.#options.lazyLoad = true

      if (rootMargin) {
        if (!lazyLoad)
          throw new Error(`"rootMargin" in options is enabled only if "lazyLoad" is set to true...`)

        this.#options.rootMargin = rootMargin
      }
    }

    if (data) {
      for (const [key, value] of Object.entries(data()))
        this.#data[key as keyof D] = value as D[keyof D]

      if (fetch) {
        this.#fetch = fetch

        if (!this.#options.ssr) {
          this.#isLoaded = false
          if (!this.#options.lazyLoad) this.#enqueue(async () => await this.#awaitData(), 'fetch')
        }
      }
    }

    if (props) this.#propsSources = [...props]

    if (className) {
      if (typeof className === 'function') {
        this.#bindings.isClassName = true
        this.#className = className
      } else this.#className = className.trim()
    }

    if (attributes) {
      if (typeof attributes === 'function') this.#bindings.isAttr = true
      this.#attrs = attributes
    }

    this.#html = html
    this.#showAttr = `${this.#ficsId}-show-syntax`

    if (css) this.#css = convertToArray(css)
    if (clonedCss) this.#css = [...clonedCss]
    if (actions) this.#actions = { ...actions }
    if (hooks) this.#hooks = { ...hooks }
  }

  #convertStr(str: string, type: 'kebab' | 'camel'): string {
    if (type === 'kebab') return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    return str.toLowerCase().replaceAll(/-([a-z])/g, (_, char) => char.toUpperCase())
  }

  #enqueue(func: () => void, key: Queue['key']): void {
    enqueue({ ficsId: this.#ficsId, func, key })
  }

  #getDataPropsMethods(): DataPropsMethods<D, P> {
    return {
      data: { ...this.#data },
      props: { ...this.#props },
      setData: <K extends keyof D>(key: K, value: D[K]): void => this.setData(key, value),
      getData: <K extends keyof D>(key: K): D[K] => this.getData(key)
    }
  }

  async #awaitData(): Promise<void> {
    if (this.#fetch) {
      const { data, props }: DataProps<D, P> = this.#getDataPropsMethods()

      for (const [key, value] of Object.entries(await this.#fetch({ data, props })))
        this.setData(key as keyof D, value as D[keyof D])

      this.#isLoaded = true
    }
  }

  #throwKeyError = (key: keyof (D & P), isProps?: boolean): void => {
    if (!(key in (isProps ? this.#props : this.#data)))
      throw new Error(
        `"${key as string}" is not defined in ${isProps ? 'props' : 'data'} of ${this.#name}...`
      )
  }

  #setProps(key: keyof P, value: P[typeof key]): void {
    if (window.customElements.get(this.#name)) {
      this.#throwKeyError(key, true)

      if (this.#props[key] !== value) {
        this.#props[key] = value
        this.#enqueue(() => this.#reRender(), 're-render')
      }
    } else this.#props[key] = value
  }

  #initProps(propsChain: PropsChain<P>): void {
    if (!this.#isInitialized) {
      for (const [key, value] of Object.entries(propsChain.get(this.#ficsId) ?? {}))
        if (!(key in this.#props)) this.#props[key as keyof P] = value as P[keyof P]

      for (const { descendant, values } of this.#propsSources)
        for (const _descendant of Array.isArray(descendant) ? descendant : [descendant]) {
          const { data, props, setData }: DataPropsMethods<D, P> = this.#getDataPropsMethods()
          const descendantId: string = _descendant.#ficsId

          for (const [key, value] of Object.entries(values({ data, props, setData }))) {
            const chain: Record<string, P> = propsChain.get(descendantId) ?? {}

            if (key in chain && propsChain.has(descendantId)) continue

            if (typeof value === 'function' && /getData/.test(value.toString())) {
              const keys: Record<string, true> = { [key]: true }
              const _value: any = value({
                getData: <K extends keyof D>(_key: K): D[K] => {
                  if (key !== _key) keys[_key as string] = true
                  return this.getData(_key)
                }
              })

              propsChain.set(descendantId, { ...chain, [key]: _value })

              if (typeof _value !== 'function') {
                const tree: PropsTree = {
                  numberId: parseInt(descendantId.replace(new RegExp(`^${this.#ficsIdName}`), '')),
                  keys,
                  setProps: (): void =>
                    _descendant.#setProps(
                      key,
                      value({ getData: <K extends keyof D>(_key: K): D[K] => this.getData(_key) })
                    )
                }
                const last: number = this.#propsTrees.length - 1
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
            } else propsChain.set(descendantId, { ...chain, [key]: value })
          }
        }

      this.#propsChain = new Map(propsChain)
      this.#isInitialized = true
    }
  }

  #addClassName(component: HTMLElement): void {
    if (this.#className) {
      const { data, props }: DataProps<D, P> = this.#getDataPropsMethods()

      if (this.#className === undefined) return

      component.setAttribute(
        'class',
        typeof this.#className === 'function' ? this.#className({ data, props }) : this.#className
      )
    }
  }

  #addAttrs(component: HTMLElement): void {
    const { data, props }: DataProps<D, P> = this.#getDataPropsMethods()

    for (const [key, value] of Object.entries(
      typeof this.#attrs === 'function' ? this.#attrs({ data, props }) : (this.#attrs ?? [])
    ))
      component.setAttribute(this.#convertStr(key, 'kebab'), value)
  }

  #getChildNodes(parent: DocumentFragment | ChildNode): ChildNode[] {
    return Array.from(parent.childNodes)
  }

  #getConvertedChildNodes(doc?: Document): ChildNode[] {
    const sanitized: unique symbol = Symbol(`${this.#ficsId}-sanitized`)
    const unsanitized: unique symbol = Symbol(`${this.#ficsId}-unsanitized`)

    const convertTemplate = (
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
      ...this.#getDataPropsMethods(),
      template: (
        templates: TemplateStringsArray,
        ...variables: (HtmlContent<D, P> | unknown)[]
      ): Sanitized<D, P> => ({ [sanitized]: convertTemplate(templates, variables) }),
      html: (str: string): Record<symbol, string> => ({ [unsanitized]: str }),
      show: (condition: boolean): string => (condition ? '' : this.#showAttr),
      setProps: (descendant: Descendant, props: object): Descendant => {
        for (const [key, value] of Object.entries(props)) descendant.#setProps(key, value)
        return descendant
      },
      isLoaded: !!doc || this.#isLoaded
    })[sanitized]

    const html: string = contents.reduce((prev, curr) => {
      if (curr instanceof FiCsElement) {
        if (!(curr.#ficsId in this.#descendants)) this.#descendants[curr.#ficsId] = curr
        curr = `<${this.#varTag} ${this.#ficsIdName}="${curr.#ficsId}"></${this.#varTag}>`
      }

      return `${prev}${curr}`
    }, '') as string

    return this.#getChildNodes((doc ?? document).createRange().createContextualFragment(html))
  }

  #isVarTag(element: Element): boolean {
    return element.localName === this.#varTag
  }

  #getFiCsId(element: Element, isProperty?: boolean): string | null {
    return isProperty
      ? (element as any)[this.#convertStr(this.#ficsIdName, 'camel')]
      : element.getAttribute(this.#ficsIdName)
  }

  async #convertTemplate(doc: Document): Promise<ChildNode[]> {
    const childNodes: ChildNode[] = this.#getConvertedChildNodes(doc)

    const convertChildNodes = async (childNodes: ChildNode[]): Promise<void> => {
      for (let index = 0; index < childNodes.length; index++) {
        const childNode: ChildNode = childNodes[index]

        if (childNode instanceof Text && childNode.nodeValue) {
          childNode.nodeValue = childNode.nodeValue.trim()

          if (childNode.nodeValue === '') {
            childNode.parentNode?.removeChild(childNode)
            childNodes.splice(index, 1)
            index--
            continue
          }
        }

        if (childNode instanceof Element) {
          if (this.#isVarTag(childNode)) {
            const ficsId: string | null = this.#getFiCsId(childNode)

            if (!ficsId)
              throw new Error(`The ${childNode} has ficsId does not exist in ${this.#name}...`)

            const descendant: FiCsElement<D, P> = this.#descendants[ficsId]
            const component: HTMLElement = await descendant.#renderOnServer(doc, this.#propsChain)
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

        await convertChildNodes(this.#getChildNodes(childNode))
      }
    }

    await convertChildNodes(childNodes)
    return childNodes
  }

  #convertCss({
    css,
    host,
    mode
  }: {
    css: Css<D, P>[]
    host: string
    mode: 'csr' | 'ssr'
  }): string {
    if (css.length === 0) return ''

    const { data, props }: DataProps<D, P> = this.#getDataPropsMethods()
    const convertCssContent = (style: Style<D, P>): string =>
      Object.entries(typeof style === 'function' ? style({ data, props }) : style).reduce(
        (prev, [key, value]) => {
          if (
            value === undefined ||
            value === '' ||
            (typeof value === 'object' && Object.keys(value).length === 0)
          )
            return prev

          key = this.#convertStr(key, 'kebab')
          if (key.startsWith('webkit')) key = `-${key}`

          return (
            `${prev}${key}` +
            (typeof value === 'string' || typeof value === 'number'
              ? `:${value};`
              : `{${convertCssContent(value)}}`)
          )
        },
        ''
      )

    const getCurlyBracket = (selector: string, type: 'left' | 'right'): string => {
      if (selector.trim() === '') return ''
      return type === 'left' ? '{' : '}'
    }

    return css.reduce((prev, curr) => {
      if (typeof curr === 'string') return `${prev}${curr}`

      let _curr: string = ''

      for (let [selector, style] of Object.entries(curr)) {
        if (Array.isArray(style) && style[1] !== mode) continue

        if (selector.startsWith(':host')) selector = selector.replace(':host', '')

        const content: string = convertCssContent(Array.isArray(style) ? style[0] : style)
        _curr += `${selector}${getCurlyBracket(selector, 'left')}${content}${getCurlyBracket(selector, 'right')}`
      }

      return `${prev}${host}{${_curr}}`
    }, '') as string
  }

  #callback(key: Exclude<keyof Hooks<D, P>, 'updated'>): void {
    if (key === 'mounted') {
      const poll = (
        func: ({ times }: { times: number }) => void,
        { interval, max, exit }: PollingOptions
      ): void => {
        let times = 0

        const execute: NodeJS.Timeout = setTimeout(function run() {
          if ((max && times >= max) || (exit && exit())) {
            clearTimeout(execute)
            return
          }

          func({ times })
          times++
          setTimeout(run, interval)
        }, interval)
      }

      this.#hooks[key]?.({ ...this.#getDataPropsMethods(), poll })
    } else this.#hooks[key]?.(this.#getDataPropsMethods())
  }

  async #renderOnServer(doc: Document, propsChain?: PropsChain<P>): Promise<HTMLElement> {
    const component: HTMLElement = doc.createElement(this.#name)

    this.#initProps(propsChain ?? this.#propsChain)
    if (this.#options.ssr) await this.#awaitData()
    this.#callback('created')

    if (this.#options.ssr) {
      this.#addClassName(component)
      this.#addAttrs(component)
      component.setHTMLUnsafe(
        `<template shadowrootmode="open"><slot name="${this.#ficsId}"></slot></template>`
      )

      const div: HTMLElement = doc.createElement('div')
      div.id = this.#ficsId
      div.slot = this.#ficsId
      for (const childNode of await this.#convertTemplate(doc)) div.append(childNode)
      component.append(div)

      const allCss: Css<D, P>[] = [...getGlobalCss(), ...this.#css]
      if (allCss.length > 0)
        div.insertAdjacentHTML(
          'beforeend',
          `<style>${this.#convertCss({ css: allCss, host: `#${this.#ficsId}`, mode: 'ssr' })}</style>`
        )
    }

    this.#enqueue(() => this.#define(), 'define')
    return component
  }

  #render(element: Element): HTMLElement {
    const ficsId: string | null = this.#getFiCsId(element)
    if (!ficsId) throw new Error(`The ${element} has ficsId does not exist in ${this.#name}...`)

    const descendant: FiCsElement<D, P> = this.#descendants[ficsId]

    descendant.#enqueue(() => descendant.#define(this.#propsChain), 'define')
    return document.createElement(descendant.#name)
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
    const newChildNodes: ChildNode[] = this.#getConvertedChildNodes()
    const convertChildNodes = (childNodes: ChildNode[]): void => {
      for (let index = 0; index < childNodes.length; index++) {
        const childNode: ChildNode = childNodes[index]

        if (childNode instanceof Text && childNode.nodeValue) {
          childNode.nodeValue = childNode.nodeValue.trim()

          if (childNode.nodeValue === '') {
            childNode.parentNode?.removeChild(childNode)
            childNodes.splice(index, 1)
            index--
            continue
          }
        }

        if (childNode instanceof Element) {
          if (this.#isVarTag(childNode)) {
            const component: HTMLElement = this.#render(childNode)
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

    convertChildNodes(newChildNodes)

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

  #addCss(shadowRoot: ShadowRoot, css?: Css<D, P>[]): void {
    const allCss: Css<D, P>[] = [...getGlobalCss(), ...this.#css]

    if (allCss.length === 0) return

    if (!css)
      for (const [index, content] of this.#css.entries()) {
        if (typeof content === 'string') continue
        if (typeof content.style === 'function') this.#bindings.css.push(index)
      }

    const stylesheet: CSSStyleSheet = new CSSStyleSheet()
    shadowRoot.adoptedStyleSheets = [stylesheet]
    stylesheet.replaceSync(this.#convertCss({ css: allCss, host: ':host', mode: 'csr' }))
  }

  #getShadowRoot(component: HTMLElement): ShadowRoot {
    if (component.shadowRoot) return component.shadowRoot

    throw new Error(`${this.#name} does not have shadowRoot...`)
  }

  #getElements(component: HTMLElement, selector: string): Element[] {
    return Array.from(this.#getShadowRoot(component).querySelectorAll(`:host ${selector}`))
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
    method: Method<D, P>,
    options?: ActionOptions
  ): void {
    if (handler !== 'click' && options?.blur)
      throw new Error('The "blur" is enabled only if the handler is click...')

    const attrs: Record<string, string> = {}

    for (let index = 0; index < element.attributes.length; index++) {
      const { name, value }: { name: string; value: string } = element.attributes[index]
      attrs[name] = value
    }

    const { debounce, throttle, blur, once }: ActionOptions = options ?? {}

    if (debounce && throttle)
      throw new Error('Debounce and throttle should not be combined in the same event handler...')

    const callback = (event: Event): void => {
      method({
        ...this.#getDataPropsMethods(),
        event,
        attributes: attrs,
        value:
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLOptionElement ||
          element instanceof HTMLProgressElement ||
          element instanceof HTMLMeterElement
            ? `${element.value}`
            : undefined
      })

      if (blur) (event.target as HTMLElement).blur()
    }

    element.addEventListener(
      handler,
      debounce
        ? this.#debounce(callback, debounce)
        : throttle
          ? this.#throttle(callback, throttle)
          : callback,
      { once }
    )
  }

  #define(propsChain?: PropsChain<P>): void {
    throwWindowError()

    const that: FiCsElement<D, P> = this
    const { lazyLoad, rootMargin }: Options = that.#options

    window.customElements.define(
      that.#name,
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

          for (const [selector, value] of Object.entries(that.#actions))
            for (const element of that.#getElements(this, selector))
              for (const [handler, _value] of Object.entries(value))
                Array.isArray(_value)
                  ? that.#addEventListener(element, handler, _value[0], _value[1])
                  : that.#addEventListener(element, handler, _value)

          that.#removeChildNodes(this)
          that.#setProperty(this, that.#ficsIdName, that.#ficsId)

          if (!that.#components.has(this)) that.#components.add(this)
        }

        connectedCallback(): void {
          if (!this.isRendered) {
            if (lazyLoad) {
              const observer: IntersectionObserver = new IntersectionObserver(
                ([{ isIntersecting, target }]) => {
                  if (isIntersecting) {
                    this.#init()
                    observer.unobserve(target)
                  }
                },
                { rootMargin }
              )

              setTimeout(() => observer.observe(this), 0)
              that.#enqueue(async () => await that.#awaitData(), 'fetch')
            }

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

  #reRender(): void {
    const component: HTMLElement | undefined = this.#components.values().next().value

    if (!component) return

    const { isClassName, isAttr, css }: Bindings = this.#bindings
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

    for (const [selector, value] of Object.entries(this.#actions)) {
      const addAllElements = (elements: Element[] | Set<Element>): void => {
        for (const element of elements) {
          if (element instanceof Element && !this.#newElements.has(element))
            this.#newElements.add(element)

          addAllElements(this.#getChildNodes(element) as Element[])
        }
      }

      addAllElements(this.#newElements)

      for (const element of this.#getElements(component, selector))
        if (this.#newElements.has(element))
          for (const [handler, _value] of Object.entries(value))
            Array.isArray(_value)
              ? this.#addEventListener(element, handler, _value[0], _value[1])
              : this.#addEventListener(element, handler, _value)
    }

    this.#newElements.clear()
  }

  async getServerComponent(doc: Document): Promise<string> {
    return await this.#renderOnServer(doc).then(component => component.outerHTML)
  }

  async ssr(parent: HTMLElement, position: 'before' | 'after' = 'after'): Promise<void> {
    const temporary: HTMLElement = document.createElement(this.#varTag)
    temporary.setHTMLUnsafe(await this.getServerComponent(document))

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
    if (parent) parent.append(document.createElement(this.#name))
  }

  setData<K extends keyof D>(key: K, value: D[K]): void {
    if (this.#data[key] !== value) {
      this.#data[key] = value
      this.#enqueue(() => this.#reRender(), 're-render')

      for (const { keys, setProps } of this.#propsTrees)
        if (typeof key === 'string' && keys[key]) setProps()

      if (this.#hooks.updated) {
        this.#throwKeyError(key)
        this.#hooks.updated[key]?.({
          setData: this.#getDataPropsMethods().setData,
          datum: this.#data[key]
        })
      }
    }
  }

  getData<K extends keyof D>(key: K): D[K] {
    this.#throwKeyError(key)
    return this.#data[key]
  }

  extend(data?: Partial<D>): FiCsElement<D, P> {
    const options: Options = { ...this.#options }
    if (!options.lazyLoad) delete options.rootMargin

    return new FiCsElement({
      name: this.#name.slice(2),
      isExceptional: false,
      data: () => ({ ...this.#data, ...(data ?? {}) }),
      fetch: this.#fetch,
      props: this.#propsSources,
      className: this.#className,
      attributes: this.#attrs,
      html: this.#html,
      clonedCss: this.#css,
      actions: this.#actions,
      hooks: this.#hooks,
      options
    })
  }
}
