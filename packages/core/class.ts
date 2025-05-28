import { globalCss } from './globalCss'
import { browserError, checkType, isBrowser, toArray, uid } from './helpers'
import { enqueue } from './queue'
import type {
  Actions,
  ActionOptions,
  Attrs,
  Bindings,
  ClassName,
  CrudOptions,
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
  OptionParams,
  PollingOptions,
  Props,
  PropsChain,
  PropsTree,
  Queue,
  Sanitized,
  Scroll,
  ServerSentEvents,
  SSEMethod,
  Style
} from './types'

const names: Record<string, number> = {}
const nameGenerators: Record<string, Generator<number>> = {}
const generator: Generator<number> = uid()

export default class FiCsElement<D extends object, P extends object> {
  readonly #ficsIdName: string = 'fics-id'
  readonly #generator: Generator<number> = uid()
  readonly #ficsId: string
  readonly #name: string
  readonly #isBrowser: boolean
  readonly #data: D = {} as D
  readonly #deferredData?: (params: DataProps<D, P, true>) => Promise<Partial<D>>
  readonly #propsSources: Props<D, P>[] = new Array()
  readonly #props: P = {} as P
  readonly #bindings: Bindings = { isClassName: false, isAttr: false, css: new Array() }
  readonly #className?: ClassName<D, P>
  readonly #attrs?: Attrs<D, P>
  readonly #html: Html<D, P>
  readonly #showAttr: string
  readonly #css: Css<D, P>[] = new Array()
  readonly #hooks: Hooks<D, P> = {}
  readonly #actions: Actions<D, P> = {}
  readonly #options: Options = { ssr: true, lazyLoad: false, rootMargin: '0px' }
  readonly #scroll: Scroll<D, P> = {} as Scroll<D, P>
  readonly #sse: ServerSentEvents<D, P> = {} as ServerSentEvents<D, P>
  readonly #propsTrees: PropsTree[] = new Array()
  readonly #descendants: Record<string, FiCsElement<D, P>> = {}
  readonly #varTag = 'f-var'
  readonly #newElements: Set<Element> = new Set()
  readonly #components: Set<HTMLElement> = new Set()
  #isDeferred: boolean = true
  #isInitialized: boolean = false
  #propsChain: PropsChain<P> = new Map()

  constructor({
    name,
    isExceptional,
    ficsId,
    data,
    deferredData,
    props,
    className,
    attributes,
    html,
    css,
    clonedCss,
    hooks,
    actions,
    options,
    scroll,
    sse
  }: FiCs<D, P>) {
    name = name.trim()
    if (name === '') throw new Error('The FiCsElement name cannot be empty....')
    name = this.#convertStr(name, 'kebab')

    if (!isExceptional && { var: true, router: true }[name])
      throw new Error(`The "${name}" is a reserved word in FiCsJS...`)

    this.#ficsId = ficsId ?? `${this.#ficsIdName}${generator.next().value}`

    if (!nameGenerators[name]) nameGenerators[name] = uid()
    names[name] = nameGenerators[name].next().value
    this.#name = `f-${name}${names[name] > 1 ? `-${names[name]}` : ''}`

    if (options) {
      const { ssr, lazyLoad, rootMargin }: OptionParams = options

      if (name === 'router' || ssr === false || lazyLoad) this.#options.ssr = false
      if (lazyLoad) this.#options.lazyLoad = true

      if (rootMargin !== '' && rootMargin !== '0px' && !checkType(rootMargin, 'undefined')) {
        if (!lazyLoad)
          throw new Error(
            `The "rootMargin" in options is enabled only if "lazyLoad" is set to true...`
          )

        this.#options.rootMargin = rootMargin
      }
    }

    this.#isBrowser = isBrowser()

    if (data) {
      let attrData: Partial<D> = {}

      if (this.#isBrowser) {
        const component: HTMLElement | null = document.getElementById(this.#name)
        if (component) {
          const attr: string | null = component.getAttribute(`data-${this.#name}`)
          if (attr) attrData = { ...JSON.parse(attr) }
        }
      }

      for (const [key, value] of Object.entries({ ...data(), ...attrData })) {
        this.#data[key as keyof D] = value as D[keyof D]

        if (deferredData) {
          this.#deferredData = deferredData
          if (this.#isBrowser) this.#isDeferred = false
        }
      }
    }

    if (props) this.#propsSources = [...props]
    if (className)
      if (checkType(className, 'function')) {
        this.#bindings.isClassName = true
        this.#className = className
      } else this.#className = className.trim()

    if (attributes) {
      if (checkType(attributes, 'function')) this.#bindings.isAttr = true
      this.#attrs = attributes
    }

    this.#html = html
    this.#showAttr = `${this.#ficsId}-show-syntax`

    if (css) this.#css = toArray(css)
    if (clonedCss) this.#css = [...clonedCss]
    if (hooks && this.#isBrowser) this.#hooks = { ...hooks }
    if (actions && this.#isBrowser) this.#actions = { ...actions }
    if (scroll && this.#isBrowser) this.#scroll = { ...scroll, isEnabled: false }
    if (sse && this.#isBrowser) this.#sse = { ...sse }
  }

  #convertStr(str: string, type: 'kebab' | 'camel'): string {
    if (type === 'kebab') return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    return str.toLowerCase().replace(/-([a-z])/g, (_, char) => char.toUpperCase())
  }

  #getDataProps(): DataProps<D, P> {
    return { data: { ...this.#data }, props: { ...this.#props } }
  }

  #getDataPropsMethods<B extends boolean = false>(isCrud?: B): DataPropsMethods<D, P, B> {
    const base: DataPropsMethods<D, P> = {
      ...this.#getDataProps(),
      setData: <K extends keyof D>(key: K, value: D[K]): void => this.setData(key, value),
      getData: <K extends keyof D>(key: K): D[K] => this.getData(key)
    }

    return (isCrud ? { ...base, crud: this.#crud.bind(this) } : base) as DataPropsMethods<D, P, B>
  }

  async #crud<T>(api: string, options?: CrudOptions<D>): Promise<T> {
    const { key, ..._options }: CrudOptions<D> = options ?? {}
    const isKeyEnabled: boolean = !!(key && checkType(this.getData(key), 'boolean'))

    if (isKeyEnabled) this.setData(key as keyof D, true as D[keyof D])
    const json: T = await fetch(api, _options).then(res => res.json())
    if (isKeyEnabled) setTimeout(() => this.setData(key as keyof D, false as D[keyof D]), 0)
    return json
  }

  #throwKeyError = (key: keyof (D & P), isProps?: boolean): void => {
    if (!(key in (isProps ? this.#props : this.#data)))
      throw new Error(
        `The "${key as string}" is not defined in ${isProps ? 'props' : 'data'} of ${this.#name}...`
      )
  }

  #enqueue(func: () => void, key: Queue['key']): void {
    enqueue({ ficsId: this.#ficsId, func, key })
  }

  #setProps(key: keyof P, value: P[typeof key]): void {
    if (this.#isBrowser && window.customElements.get(this.#name)) {
      this.#throwKeyError(key, true)

      if (this.#props[key] !== value) {
        this.#props[key] = value
        this.#enqueue(() => this.#reRender(), 're-render')
      }
    } else if (this.#props[key] !== value) this.#props[key] = value
  }

  #initProps(propsChain: PropsChain<P>): void {
    if (!this.#isInitialized) {
      for (const [key, value] of Object.entries(propsChain.get(this.#ficsId) ?? {}))
        if (!(key in this.#props)) this.#props[key as keyof P] = value as P[keyof P]

      for (const { descendant, values } of this.#propsSources)
        for (const _descendant of Array.isArray(descendant) ? descendant : [descendant]) {
          const { data, props, setData, crud }: DataPropsMethods<D, P, true> =
            this.#getDataPropsMethods(true)
          const descendantId: string = _descendant.#ficsId

          for (const [key, value] of Object.entries(values({ data, props, setData, crud }))) {
            const chain: Record<string, P> = propsChain.get(descendantId) ?? {}

            if (key in chain && propsChain.has(descendantId)) continue

            if (checkType(value, 'function') && /getData/.test(value.toString())) {
              const keys: Record<string, true> = { [key]: true }
              const _value: any = value({
                getData: <K extends keyof D>(_key: K): D[K] => {
                  if (key !== _key) keys[_key as string] = true
                  return this.getData(_key)
                }
              })

              propsChain.set(descendantId, { ...chain, [key]: _value })

              if (!checkType(_value, 'function')) {
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

  #getClassName() {
    if (!this.#className) return ''

    return checkType(this.#className, 'function')
      ? this.#className(this.#getDataProps())
      : this.#className
  }

  #addClassName(component: HTMLElement): void {
    if (!this.#className) return
    component.setAttribute('class', this.#getClassName())
  }

  #getAttrs(): [string, string][] {
    return Object.entries(
      checkType(this.#attrs, 'function') ? this.#attrs(this.#getDataProps()) : (this.#attrs ?? [])
    )
  }

  #addAttrs(component: HTMLElement): void {
    for (const [key, value] of this.#getAttrs())
      component.setAttribute(this.#convertStr(key, 'kebab'), value)
  }

  #getChildNodes(parent: DocumentFragment | ChildNode): ChildNode[] {
    return Array.from(parent.childNodes)
  }

  #convertTemplate(): string {
    const sanitized: unique symbol = Symbol(`${this.#ficsId}-sanitized`)
    const unsanitized: unique symbol = Symbol(`${this.#ficsId}-unsanitized`)

    const _convertTemplate = (
      templates: TemplateStringsArray,
      variables: (HtmlContent<D, P> | unknown)[]
    ): HtmlContent<D, P>[] => {
      const isSymbol = (variable: unknown, symbol: symbol): boolean =>
        !!(variable && checkType(variable, 'object') && symbol in variable)
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

          variable = checkType(variable, 'string')
            ? variable.replace(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
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
      ): Sanitized<D, P> => ({ [sanitized]: _convertTemplate(templates, variables) }),
      html: (str: string): Record<symbol, string> => ({ [unsanitized]: str }),
      show: (condition: boolean): string => (condition ? '' : this.#showAttr),
      setProps: (descendant: Descendant, props: object): Descendant => {
        descendant.#initProps(this.#propsChain)

        const _descendant: Descendant = new FiCsElement({
          name: `${descendant.#name.slice(2)}`,
          ficsId: `${descendant.#ficsId}-${descendant.#generator.next().value}`,
          data: () => descendant.#data,
          deferredData: descendant.#deferredData,
          props: descendant.#propsSources,
          className: descendant.#className,
          attributes: descendant.#attrs,
          html: descendant.#html,
          clonedCss: descendant.#css,
          actions: descendant.#actions,
          hooks: descendant.#hooks,
          options: descendant.#options
        })

        for (const [key, value] of Object.entries({ ...descendant.#props, ...props }))
          _descendant.#setProps(key, value)

        return _descendant
      },
      isBrowser: this.#isBrowser,
      isDeferred: this.#isDeferred
    })[sanitized]

    return contents.reduce((prev, curr) => {
      if (curr instanceof FiCsElement) {
        if (!(curr.#ficsId in this.#descendants)) this.#descendants[curr.#ficsId] = curr
        curr = `<${this.#varTag} ${this.#ficsIdName}="${curr.#ficsId}"></${this.#varTag}>`
      }

      return `${prev}${curr}`
    }, '') as string
  }

  #removeChildNodes(target: HTMLElement | ChildNode[]): void {
    for (const childNode of target instanceof HTMLElement ? this.#getChildNodes(target) : target)
      childNode.remove()
  }

  #setProperty<V>(element: HTMLElement, property: string, value: V): void {
    ;(element as any)[this.#convertStr(property, 'camel')] = value
  }

  #addHtml(shadowRoot: ShadowRoot, isInitialized?: boolean): void {
    const isElement = (childNode: ChildNode): childNode is Element => childNode instanceof Element
    const oldChildNodes: ChildNode[] = this.#getChildNodes(shadowRoot)
    const newChildNodes: ChildNode[] = this.#getChildNodes(
      document.createRange().createContextualFragment(this.#convertTemplate())
    )

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

        if (isElement(childNode)) {
          if (childNode.localName === this.#varTag) {
            const ficsId: string | null = childNode.getAttribute(this.#ficsIdName)

            if (!ficsId || !(ficsId in this.#descendants))
              throw new Error(
                `The element ${childNode} does not have a valid ficsId in ${this.#name}...`
              )

            const descendant: FiCsElement<D, P> = this.#descendants[ficsId]
            descendant.#initProps(this.#propsChain)
            descendant.#callback('created')
            descendant.#enqueue(() => descendant.#define(), 'define')

            const component: HTMLElement = document.createElement(descendant.#name)
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

    if (isInitialized) for (const childNode of newChildNodes) shadowRoot.append(childNode)
    else if (newChildNodes.length === 0) this.#removeChildNodes(oldChildNodes)
    else {
      const that: FiCsElement<D, P> = this
      let { activeElement }: { activeElement: Element | null } = shadowRoot

      const isSameNode = (oldChildNode: ChildNode, newChildNode: ChildNode): boolean =>
        oldChildNode.nodeName === newChildNode.nodeName

      const getKey = (element: Element): string | null => element.getAttribute('key')

      const matchChildNode = (oldChildNode: ChildNode, newChildNode: ChildNode): boolean => {
        const _isSameNode: boolean = isSameNode(oldChildNode, newChildNode)

        return isElement(oldChildNode) && isElement(newChildNode)
          ? _isSameNode && getKey(oldChildNode) === getKey(newChildNode)
          : _isSameNode
      }

      function patchChildNode(oldChildNode: ChildNode, newChildNode: ChildNode): void {
        if (oldChildNode instanceof Text && newChildNode instanceof Text)
          oldChildNode.nodeValue = newChildNode.nodeValue
        else if (isElement(oldChildNode) && isElement(newChildNode)) {
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
          if (!isElement(newChildNode)) continue

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
          if (isElement(childNode)) that.#newElements.add(childNode)

          parentNode.insertBefore(
            childNode,
            before && !before.parentNode?.isEqualNode(parentNode) ? null : before
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
          const key: string | null = isElement(childNode) ? getKey(childNode) : null

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
            insertBefore(oldEndNode, newStartNode)
            focusNode(oldEndNode)
            oldEndNode = oldChildNodes[--oldEndIndex]
            newStartNode = newChildNodes[++newStartIndex]
          } else {
            if (dom.size === 0)
              for (const oldChildNode of oldChildNodes) {
                if (
                  isElement(oldChildNode) &&
                  !!(oldChildNode as any)[that.#convertStr(that.#ficsIdName, 'camel')]
                )
                  continue

                const mapKey: string = getMapKey(oldChildNode)
                dom.set(mapKey, [...(dom.get(mapKey) ?? []), oldChildNode])
              }

            const mapStartNode: ChildNode | undefined = dom.get(getMapKey(newStartNode))?.shift()

            if (mapStartNode && isSameNode(mapStartNode, newStartNode)) {
              patchChildNode(mapStartNode, newStartNode)
              keyChildNodes.set(getMapKey(mapStartNode), mapStartNode)
            } else if (isElement(newStartNode)) {
              const _getKey = (element: Element): string | number | null => {
                let key: string | number | null = getKey(element)
                if (key && !isNaN(parseInt(key))) key = parseInt(key)

                return key
              }
              const key: string | number | null = _getKey(newStartNode)

              if (checkType(key, 'number')) {
                let _oldStartIndex: number = oldStartIndex
                let reference: Element | null = null

                while (_oldStartIndex <= oldEndIndex) {
                  const childNode = oldChildNodes[_oldStartIndex++]

                  if (isElement(childNode)) {
                    const _key: string | number | null = _getKey(childNode)

                    if (
                      isSameNode(newStartNode, childNode) &&
                      checkType(_key, 'number') &&
                      _key > key
                    ) {
                      reference = childNode
                      break
                    }
                  }
                }

                insertBefore(newStartNode, reference)
              } else insertBefore(newStartNode, oldStartNode)
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

  #getCss(): Css<D, P>[] {
    return [...globalCss(), ...this.#css]
  }

  #convertCss({ css, mode }: { css: Css<D, P>[]; mode: 'csr' | 'ssr' }): string {
    if (css.length === 0) return ''

    let topLevelCss: string = ''
    const convertCssContent = (style: Style<D, P>): string =>
      Object.entries(checkType(style, 'function') ? style(this.#getDataProps()) : style).reduce(
        (prev, [key, value]) => {
          if (
            checkType(value, 'undefined') ||
            value === '' ||
            (checkType(value, 'object') && Object.keys(value).length === 0)
          )
            return prev

          key = this.#convertStr(key, 'kebab')
          if (key.startsWith('webkit')) key = `-${key}`

          if (key.startsWith('@keyframes')) {
            topLevelCss += `${key}{${convertCssContent(value as Style<D, P>)}}`
            return prev
          }

          return `${prev}${key}${checkType(value, 'string') || checkType(value, 'number') ? `:${value};` : `{${convertCssContent(value)}}`}`
        },
        ''
      )

    return css.reduce((prev, curr) => {
      if (checkType(curr, 'string')) return `${prev}${curr}`

      let _curr: string = ''

      for (let [selector, style] of Object.entries(curr)) {
        if (Array.isArray(style) && style[1] !== mode) continue

        if (mode === 'ssr' && selector.startsWith(':host'))
          selector = selector.replace(':host', this.#name)

        const content: string = convertCssContent(Array.isArray(style) ? style[0] : style)
        const index: number = content.indexOf('{')

        if (selector.startsWith(':host') && index > -1) {
          const hostCss: string = content.slice(0, index)
          const lastIndex: number = hostCss.lastIndexOf(';')
          const hostCssContent: string = hostCss.slice(0, lastIndex - hostCss.length)
          const _selector: string = hostCss.slice(lastIndex + 1)

          _curr += `${selector}{${hostCssContent}}${_selector}${content.slice(index)}`
        } else _curr += `${selector}{${content}}`
      }

      return `${prev}${_curr}${topLevelCss}`
    }, '') as string
  }

  #addCss(shadowRoot: ShadowRoot, additional: Css<D, P>[]): void {
    const css: Css<D, P>[] = this.#getCss()

    if (css.length === 0) return

    if (additional.length === 0)
      for (const [index, content] of this.#css.entries()) {
        if (checkType(content, 'string')) continue
        if (checkType(Object.values(content)[0], 'function')) this.#bindings.css.push(index)
      }

    const stylesheet: CSSStyleSheet = new CSSStyleSheet()
    shadowRoot.adoptedStyleSheets = [stylesheet]
    stylesheet.replaceSync(this.#convertCss({ css: [':host{display:block}', ...css], mode: 'csr' }))
  }

  #getShadowRoot(component: HTMLElement): ShadowRoot {
    if (component.shadowRoot) return component.shadowRoot

    throw new Error(`${this.#name} does not have shadowRoot...`)
  }

  #getElements(component: HTMLElement, selector: string): Element[] {
    if (selector === '') return [component]
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
    entries: [string, Method<D, P> | [Method<D, P>, ActionOptions]][]
  ) {
    const addEventListener = (
      handler: string,
      method: Method<D, P>,
      options?: ActionOptions
    ): void => {
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
          ...this.#getDataPropsMethods(true),
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

        const { activeElement }: { activeElement: Element | null } = document
        if (blur && activeElement instanceof HTMLElement) activeElement.blur()
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

    for (const [handler, _value] of entries)
      Array.isArray(_value)
        ? addEventListener(handler, _value[0], _value[1])
        : addEventListener(handler, _value)
  }

  #infiniteScroll(shadowRoot: ShadowRoot): void {
    if ('area' in this.#scroll && !this.#scroll.isEnabled) {
      const { area, rootMargin, trigger, method }: Scroll<D, P> = this.#scroll
      const _trigger: boolean | undefined = trigger?.({ data: this.#data })

      if (checkType(_trigger, 'undefined') || _trigger) {
        const root: Element | null = shadowRoot.querySelector(area)

        if (!root)
          throw new Error(`The "${area}" is not found in the shadowRoot of ${this.#name}...`)

        let { lastElementChild: lastChild }: { lastElementChild: Element | null } = root

        if (lastChild) {
          const intersectionObserver: IntersectionObserver = new IntersectionObserver(
            async ([{ isIntersecting }]) => {
              if (isIntersecting) method({ ...this.#getDataPropsMethods(true) })
            },
            { rootMargin }
          )

          const mutationObserver = new MutationObserver(() => {
            const { lastElementChild }: { lastElementChild: Element | null } = root

            if (lastElementChild && lastElementChild !== lastChild) {
              if (lastChild) intersectionObserver.unobserve(lastChild)
              intersectionObserver.observe(lastElementChild)
              lastChild = lastElementChild
            }
          })

          intersectionObserver.observe(lastChild)
          mutationObserver.observe(root, { childList: true })
          this.#scroll.isEnabled = true
        }
      }
    }
  }

  #callback(key: Exclude<keyof Hooks<D, P>, 'updated'>): void {
    if (this.#hooks?.[key] === undefined) return
    if (key === 'mounted') {
      const poll = (
        func: ({ times }: { times: number }) => void,
        { interval, max, exit }: PollingOptions
      ): void => {
        let times = 0

        const execute: ReturnType<typeof setTimeout> = setTimeout(function run() {
          if ((max && times >= max) || (exit && exit())) {
            clearTimeout(execute)
            return
          }

          func({ times })
          times++
          setTimeout(run, interval)
        }, interval)
      }

      this.#hooks[key]({ ...this.#getDataPropsMethods(true), poll })
    } else this.#hooks[key]({ ...this.#getDataPropsMethods(true) })
  }

  #define(): void {
    browserError()

    const that: FiCsElement<D, P> = this
    const { lazyLoad, rootMargin }: Options = that.#options

    window.customElements.define(
      that.#name,
      class extends HTMLElement {
        readonly #shadowRoot: ShadowRoot
        #isRendered: boolean = false
        #eventSource?: EventSource

        constructor() {
          super()
          this.#shadowRoot = this.attachShadow({ mode: 'open' })
          if (!lazyLoad) this.#init()
        }

        #init() {
          if (that.#deferredData)
            that.#enqueue(async () => {
              for (const [key, value] of Object.entries(
                await that.#deferredData!({ ...that.#getDataProps(), crud: that.#crud.bind(that) })
              ))
                that.setData(key as keyof D, value as D[keyof D])

              that.#isDeferred = true
            }, 'fetch')

          that.#addClassName(this)
          that.#addAttrs(this)
          that.#addHtml(this.#shadowRoot, true)
          that.#addCss(this.#shadowRoot, [])

          for (const [selector, value] of Object.entries(that.#actions))
            for (const element of that.#getElements(this, selector))
              that.#addEventListener(element, Object.entries(value))

          that.#removeChildNodes(this)
          that.#setProperty(this, that.#ficsIdName, that.#ficsId)

          if (!that.#components.has(this)) that.#components.add(this)
        }

        async connectedCallback(): Promise<void> {
          if (!this.#isRendered) {
            if (lazyLoad) {
              const observer: IntersectionObserver = new IntersectionObserver(
                async ([{ isIntersecting, target }]) => {
                  if (isIntersecting) {
                    this.#init()
                    observer.unobserve(target)
                  }
                },
                { rootMargin }
              )

              setTimeout(() => observer.observe(this), 0)
            }

            that.#infiniteScroll(this.#shadowRoot)

            if ('path' in that.#sse) {
              const {
                path,
                withCredentials,
                onopen,
                onmessage,
                onerror,
                actions
              }: ServerSentEvents<D, P> = that.#sse
              this.#eventSource = new EventSource(path, { withCredentials })

              if (onopen)
                this.#eventSource.onopen = (event: Event): void =>
                  onopen({ ...that.#getDataPropsMethods(true), event })

              if (onmessage)
                this.#eventSource.onmessage = (event: MessageEvent): void =>
                  onmessage({ ...that.#getDataPropsMethods(true), event })

              if (onerror)
                this.#eventSource.onerror = (event: Event): void =>
                  onerror({ ...that.#getDataPropsMethods(true), event })

              if (actions) {
                const addEventListener = (
                  eventSource: EventSource,
                  handler: string,
                  method: SSEMethod<D, P>,
                  options?: ActionOptions
                ): void => {
                  const { debounce, throttle, once }: ActionOptions = options ?? {}

                  if (debounce && throttle)
                    throw new Error(
                      'Debounce and throttle should not be combined in the same event handler...'
                    )

                  const callback = (event: MessageEvent): void =>
                    method({ ...that.#getDataPropsMethods(true), event })

                  eventSource.addEventListener(
                    handler,
                    debounce
                      ? that.#debounce(callback, debounce)
                      : throttle
                        ? that.#throttle(callback, throttle)
                        : callback,
                    { once }
                  )
                }

                for (const [handler, value] of Object.entries(actions))
                  Array.isArray(value)
                    ? addEventListener(this.#eventSource, handler, value[0], value[1])
                    : addEventListener(this.#eventSource, handler, value)
              }
            }

            that.#callback('mounted')
            this.#isRendered = true
          }
        }

        disconnectedCallback(): void {
          this.#eventSource?.close()
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

    if (this.#isBrowser) {
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
          if (this.#newElements.has(element)) this.#addEventListener(element, Object.entries(value))
      }

      this.#newElements.clear()
    }
  }

  toString(data?: Partial<D>): string {
    const render = (that: FiCsElement<D, P>, data?: Partial<D>): string => {
      that.#initProps(this.#propsChain)

      if (that.#options.ssr) {
        const className: string = that.#className ? `class="${that.#getClassName()}"` : ''
        const value: string = `${className} ${that
          .#getAttrs()
          .reduce(
            (prev, [key, value]) => `${prev} ${that.#convertStr(key, 'kebab')}="${value}"`,
            ''
          )}`.trim()
        const attrs = (name: string): string =>
          `id="${name}" slot="${name}"${data ? ` data-${name}='${JSON.stringify(data)}'` : ''}`

        const applyDescendant = (html: string): string => {
          const varBegin: string = `<${that.#varTag} ${that.#ficsIdName}="`
          const varEnd: string = `"></${that.#varTag}>`

          const varBeginIndex: number = html.indexOf(varBegin)
          const varEndIndex: number = html.indexOf(varEnd)

          if (varBeginIndex < 0 || varEndIndex < 0) return html

          const prev: string = html.slice(0, varBeginIndex)
          const next: string = applyDescendant(html.slice(varEndIndex + varEnd.length))
          const ficsId: string = html.slice(varBeginIndex + varBegin.length, varEndIndex)

          if (!(ficsId in that.#descendants))
            throw new Error(`The element does not have a valid ficsId in ${that.#name}...`)

          return `${prev}${render(that.#descendants[ficsId])}${next}`
        }

        const applyShowAttr = (html: string): string => {
          const showAttrIndex: number = html.indexOf(that.#showAttr)
          if (showAttrIndex < 0) return html

          const openIndex: number = html.indexOf('<', showAttrIndex)
          const closeIndex: number = html.indexOf('>', showAttrIndex)
          const prev: string = html.slice(0, showAttrIndex)
          let next: string = applyShowAttr(html.slice(showAttrIndex + that.#showAttr.length))

          if (openIndex > 0 && openIndex < closeIndex) return `${prev}${that.#showAttr}${next}`

          const styleAttr: string = 'style="'
          const styleIndex: number = prev.lastIndexOf(styleAttr)
          const displayKey: string = 'display:'
          const displayNone: string = `${displayKey}none`

          if (styleIndex < 0) return `${prev}${styleAttr}${displayNone}"${next}`

          let newPrev: string = `${prev.slice(0, styleIndex)}${styleAttr}`
          let remaining: string = prev.slice(styleIndex + styleAttr.length)
          const endIndex: number = remaining.indexOf('"')

          if (endIndex < 0) throw new Error('The style attribute is not closed...')

          next = `${remaining.slice(endIndex).trim()}${next}`
          remaining = remaining.slice(0, endIndex).replace(/\s/g, '')

          const displayIndex: number = remaining.indexOf(displayKey)
          if (displayIndex < 0) return `${newPrev}${remaining}; ${displayNone}${next}`

          newPrev += remaining.slice(0, displayIndex)
          remaining = remaining.slice(displayIndex)

          const displayEndIndex: number = remaining.indexOf(';', displayIndex)
          if (displayEndIndex < 0) return `${newPrev}${displayNone}${next}`

          return `${newPrev}${displayNone}${remaining.slice(displayEndIndex)}${next}`
        }

        const html: string = applyShowAttr(
          applyDescendant(that.#convertTemplate().replace(/>\s+</g, '><').replace(/\n\s/g, ''))
        )
        const css = (_css: Css<D, P>[]): string =>
          _css.length > 0 ? `<style>${that.#convertCss({ css: _css, mode: 'ssr' })}</style>` : ''

        return `
          <${that.#name}${value.length > 0 ? ` ${value}` : ''}>
            <template shadowrootmode="open"><slot name="${that.#name}"></slot></template>
            <div ${attrs(that.#name)}>${html}${css(that.#getCss())}</div>
          </${that.#name}>
        `
      }

      return `<${that.#name}></${that.#name}>`
    }

    if (data)
      for (const [key, value] of Object.entries(data))
        this.setData(key as keyof D, value as D[keyof D])

    return render(this, data)
  }

  describe(parent?: HTMLElement): void {
    this.#initProps(this.#propsChain)
    this.#callback('created')
    this.#enqueue(() => this.#define(), 'define')
    if (parent) parent.append(document.createElement(this.#name))
  }

  setData<K extends keyof D>(key: K, value: D[K]): void {
    if (this.#data[key] !== value) {
      this.#data[key] = value

      if (this.#isBrowser && this.#components.size > 0)
        this.#enqueue(() => {
          this.#reRender()
          this.#infiniteScroll(this.#getShadowRoot(this.#components.values().next().value!))
        }, 're-render')

      for (const { keys, setProps } of this.#propsTrees)
        if (checkType(key, 'string') && keys[key]) setProps()

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
}
