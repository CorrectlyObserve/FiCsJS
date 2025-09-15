import { globalCss } from './globalCss'
import {
  browserError,
  checkType,
  convertStr,
  isBlankObject,
  isBrowser,
  numberError,
  toArray,
  uid
} from './helpers'
import { i18n } from './i18n'
import { enqueue } from './queue'
import type {
  Actions,
  ActionOptions,
  Attrs,
  Bindings,
  Children,
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
  I18n,
  Method,
  Options,
  OptionParams,
  PollingOptions,
  Props,
  PropsBinding,
  PropsChain,
  Queue,
  Sanitized,
  Scroll,
  SendToWebsocket,
  SingleOrArray,
  SSEMethod,
  Style,
  Syntaxes,
  WebSocketParams,
  WebSocketValue
} from './types'

const ficsIdName = 'fics-id' as const
const generator: Generator<number> = uid()
const nameGenerators: Map<string, Generator<number>> = new Map()
const names: Map<string, number> = new Map()
const propsMap: Map<string, PropsBinding[]> = new Map()
const varTag = 'f-var' as const

export default class FiCsElement<D extends object, P extends object> {
  readonly #nameKey: string
  readonly #instanceId: string
  readonly #componentId: string
  readonly #name: string
  readonly #children: Children = {}
  readonly #isBrowser: boolean
  readonly #data: D = {} as D
  readonly #deferredData?: (params: DataProps<D, P, true>) => Promise<Partial<D>>
  readonly #i18nData?: (params: DataProps<D, P, false> & I18n) => Promise<Partial<D>>
  readonly #propsSources: Props<D, P>[] = new Array()
  readonly #props: P = {} as P
  readonly #bindings: Bindings = { isClassName: false, isAttr: false, css: new Array() }
  readonly #classNames?: ClassName<D, P>
  readonly #attrs?: Attrs<D, P>
  readonly #html: Html<D, P>
  readonly #showAttr: string
  readonly #css: Css<D, P>[] = new Array()
  readonly #hooks: Hooks<D, P> = {}
  readonly #actions: Actions<D, P> = {}
  readonly #options: Options<D, P> = {
    ssr: true,
    lazyLoad: false,
    rootMargin: '0px',
    websocket: undefined,
    sse: undefined
  }
  readonly #scroll: Scroll<D, P> = {} as Scroll<D, P>
  readonly #apiStatuses: Map<string, boolean> = new Map()
  readonly #propsChain: PropsChain<P> = new Map()
  readonly #ancestorIds: string[] = new Array()
  readonly #clonedSelves: Map<string, Descendant> = new Map()
  readonly #childrenStore: Record<string, FiCsElement<D, P>> = {}
  readonly #newElements: Set<Element> = new Set()
  readonly #components: Set<HTMLElement> = new Set()
  #isDeferred: boolean = true
  #isInitialized: boolean = false
  #websocket?: { send: SendToWebsocket; isOpened: () => boolean }
  #poll?: ReturnType<typeof setTimeout>

  constructor({
    name,
    isExceptional,
    instanceId,
    componentId,
    children,
    data,
    deferredData,
    i18nData,
    props,
    className,
    attributes,
    html,
    css,
    clonedCss,
    hooks,
    actions,
    options,
    scroll
  }: FiCs<D, P>) {
    name = name.trim()
    if (name === '') throw new Error('The FiCsElement name cannot be empty....')
    name = convertStr(name, 'kebab')
    this.#nameKey = convertStr(name, 'camel')

    if (!isExceptional && { var: true, router: true, link: true }[name])
      throw new Error(`The "${name}" is a reserved word in FiCsJS...`)

    this.#instanceId = instanceId ?? `${ficsIdName}${generator.next().value}`
    this.#componentId = componentId ?? this.#instanceId

    if (!nameGenerators.has(name)) nameGenerators.set(name, uid())
    names.set(name, nameGenerators.get(name)!.next().value)
    this.#name = `f-${name}${names.get(name)! > 1 ? `${isBrowser() ? '' : '-server'}-${names.get(name)}` : ''}`

    propsMap.set(this.#instanceId, [])

    this.#isBrowser = isBrowser()

    if (options) {
      const { ssr, lazyLoad, rootMargin, websocket, sse }: OptionParams<D, P> = options

      if (name === 'router' || ssr === false || lazyLoad) this.#options.ssr = false
      if (lazyLoad) this.#options.lazyLoad = true

      if (rootMargin !== '' && rootMargin !== '0px' && !checkType(rootMargin, 'undefined')) {
        if (!lazyLoad)
          throw new Error(
            `The "rootMargin" in options is enabled only if "lazyLoad" is set to true...`
          )

        this.#options.rootMargin = rootMargin
      }

      if (websocket && !isBlankObject(websocket) && this.#isBrowser)
        this.#options.websocket = { ...websocket }
      if (sse && !isBlankObject(sse) && this.#isBrowser) this.#options.sse = { ...sse }
    }

    if (children)
      for (const child of children)
        this.#children[child.#nameKey] =
          convertStr(child.#nameKey, 'kebab') === child.#name.slice(2) ? child.#clone() : child

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

        if ((deferredData || i18nData) && this.#isBrowser) {
          this.#isDeferred = false

          if (deferredData) this.#deferredData = deferredData
          if (i18nData) this.#i18nData = i18nData
        }
      }
    }

    if (props && toArray(props).length > 0) this.#propsSources = toArray(props)
    if (className)
      if (checkType(className, 'function')) {
        this.#bindings.isClassName = true
        this.#classNames = className
      } else this.#classNames = className.trim()

    if (attributes) {
      if (checkType(attributes, 'function')) this.#bindings.isAttr = true
      this.#attrs = attributes
    }

    this.#html = html
    this.#showAttr = `${this.#instanceId}-show-syntax`

    if (css) this.#css = toArray(css)
    if (clonedCss) this.#css = [...clonedCss]

    if (hooks && !isBlankObject(hooks) && this.#isBrowser) this.#hooks = { ...hooks }
    if (actions && !isBlankObject(actions) && this.#isBrowser) this.#actions = { ...actions }
    if (scroll && !isBlankObject(scroll) && this.#isBrowser)
      this.#scroll = {
        ...scroll,
        id: `${this.#componentId}-scroll`,
        start: 0,
        end: scroll.unit,
        isEnabled: false,
        totalHeight: NaN,
        elementHeights: new Map(),
        prevTotalHeight: NaN
      }
  }

  #clone(instanceId?: string): FiCsElement<D, P> {
    return new FiCsElement({
      name: this.#nameKey,
      instanceId: instanceId ?? this.#instanceId,
      componentId: this.#componentId,
      children: Object.values(this.#children),
      data: () => this.#data,
      deferredData: this.#deferredData,
      i18nData: this.#i18nData,
      props: this.#propsSources,
      className: this.#classNames,
      attributes: this.#attrs,
      html: this.#html,
      clonedCss: this.#css,
      actions: this.#actions,
      hooks: this.#hooks,
      options: this.#options,
      scroll: this.#scroll
    })
  }

  get #dataProps(): DataProps<D, P> {
    return { data: { ...this.#data }, props: { ...this.#props } }
  }

  #internalSetData<K extends keyof D>(key: K, value: D[K], isNotRerendered?: boolean): void {
    if (this.#data[key] !== value) {
      this.#data[key] = value

      for (const { propsKeys, propsValue, setProps } of this.#getPropsBindings())
        if (checkType(key, 'string') && propsKeys[key]) setProps(propsValue())

      const { data, ...args }: DataPropsMethods<D, P, true> = this.#getDataPropsMethods(true),
        updated: Hooks<D, P>['updated'] | undefined = this.#hooks.updated

      if (updated && key in updated) {
        this.#throwKeyError(key)
        updated[key]!({ data: { ...data, [key]: this.#data[key] }, ...args })
      }

      if (!isNotRerendered && this.#isBrowser && this.#components.size > 0)
        this.#enqueue(() => {
          this.#reRender()
          this.#infiniteVirtualScroll(this.#getShadowRoot(this.#components.values().next().value!))
        }, 're-render')
    }
  }

  async #crud<T>(api: string, options?: CrudOptions): Promise<T> {
    const { key, delay, ..._options }: CrudOptions = options ?? {}

    if (!key) return fetch(api, _options).then(res => res.json())

    numberError({ delay })

    if (this.#apiStatuses.get(key) === true)
      console.warn(`The internal API status key "${key}" is already in progress...`)

    this.#apiStatuses.set(key, true)
    this.#enqueue(() => this.#reRender(true), 're-render')
    await new Promise(resolve => setTimeout(resolve, delay ?? 0))

    const json: T = await fetch(api, _options).then(res => res.json())

    this.#apiStatuses.set(key, false)
    this.#enqueue(() => this.#reRender(true), 're-render')

    return json
  }

  #getDataPropsMethods<B extends boolean = false>(isCrud?: B): DataPropsMethods<D, P, B> {
    const base: DataPropsMethods<D, P> = {
      ...this.#dataProps,
      setData: <K extends keyof D>(key: K, value: D[K]): void => this.#internalSetData(key, value),
      getData: <K extends keyof D>(key: K): D[K] => this.getData(key)
    }

    return (isCrud ? { ...base, crud: this.#crud.bind(this) } : base) as DataPropsMethods<D, P, B>
  }

  #getPropsBindings(instanceId?: string): PropsBinding[] {
    return propsMap.get(instanceId ?? this.#instanceId) ?? []
  }

  #throwKeyError = (key: keyof (D & P), isProps?: boolean): void => {
    if (!(key in (isProps ? this.#props : this.#data)))
      throw new Error(
        `The "${key as string}" is not defined in ${isProps ? 'props' : 'data'} of ${this.#name}...`
      )
  }

  #enqueue(func: () => void, key: Queue['key']): void {
    enqueue({ instanceId: this.#instanceId, func, key })
  }

  #setProps(key: keyof P, value: P[typeof key]): void {
    if (this.#isBrowser) {
      if (window.customElements.get(this.#name)) this.#throwKeyError(key, true)

      if (this.#props[key] !== value) {
        this.#props[key] = value
        if (this.#components.size > 0) this.#enqueue(() => this.#reRender(), 're-render')
      }
    } else if (this.#props[key] !== value) this.#props[key] = value
  }

  #initProps(propsChain: PropsChain<P>, ancestorIds: string[]): void {
    if (!this.#isInitialized) {
      const entries = (id: string): [string, P][] => Object.entries(propsChain.get(id) ?? {})

      for (const [key, value] of entries(this.#componentId))
        if (!(key in this.#props)) this.#props[key as keyof P] = value as P[keyof P]

      if (this.#componentId !== this.#instanceId)
        for (const [key, value] of entries(this.#instanceId))
          this.#props[key as keyof P] = value as P[keyof P]

      for (const { descendant, values } of this.#propsSources) {
        const addGetChildren = (children: Children): void => {
          for (const child of Object.values(children)) {
            child.getChildren = (): Children => child.#children
            addGetChildren(child.getChildren())
          }
        }

        addGetChildren(this.#children)

        const returned: SingleOrArray<Descendant> = descendant({ children: this.#children })

        for (const _descendant of Array.isArray(returned) ? returned : [returned]) {
          if (checkType(_descendant, 'undefined')) continue

          const instanceId: string = _descendant.#instanceId

          for (const [key, value] of Object.entries(values(this.#getDataPropsMethods(true)))) {
            const chain: Partial<P> | undefined = propsChain.get(instanceId)

            if (chain && key in chain && propsChain.has(instanceId)) continue

            if (checkType(value, 'function') && /getData/.test(value.toString())) {
              const propsKeys: Record<string, true> = { [key]: true },
                _value: P[keyof P] = value({
                  getData: <K extends keyof D>(_key: K): D[K] => {
                    if (key !== _key) propsKeys[_key as string] = true
                    return this.getData(_key)
                  },
                  sendToWebsocket: (value: WebSocketValue): void | undefined => {
                    if (!this.#websocket) return undefined

                    const { send, isOpened }: { send: SendToWebsocket; isOpened: () => boolean } =
                      this.#websocket

                    return isOpened() ? send(value) : undefined
                  }
                })

              propsChain.set(instanceId, { ...chain, [key]: _value } as Partial<P>)

              if (checkType(_value, 'function')) continue

              const propsBindings: PropsBinding[] = this.#getPropsBindings()
              const last: number = propsBindings.length - 1
              const start: number = instanceId.indexOf(ficsIdName) + ficsIdName.length
              const end: number = instanceId.indexOf('-', start)
              const newBinding: PropsBinding = {
                instanceId,
                numberId: parseInt(instanceId.slice(start, end === -1 ? undefined : end)),
                propsKeys,
                propsKey: key,
                propsValue: () =>
                  value({ getData: <K extends keyof D>(_key: K): D[K] => this.getData(_key) }),
                setProps: (value: unknown) => _descendant.#setProps(key, value)
              }
              const isLargerNumberId = (index: number): boolean =>
                propsBindings[index].numberId >= newBinding.numberId

              if (last > 2) {
                let min: number = 0,
                  max: number = last

                while (min <= max) {
                  const mid: number = Math.floor((min + max) / 2)
                  isLargerNumberId(mid) ? (min = mid + 1) : (max = mid - 1)
                }

                propsBindings.splice(min, 0, newBinding)
              } else
                propsBindings[last < 0 || isLargerNumberId(last) ? 'push' : 'unshift'](newBinding)

              propsMap.set(this.#instanceId, propsBindings)
            } else propsChain.set(instanceId, { ...chain, [key]: value })
          }
        }
      }

      for (const [key, value] of propsChain) this.#propsChain.set(key, value)

      for (const ancestorId of ancestorIds) {
        const propsBindings: PropsBinding[] = this.#getPropsBindings(ancestorId)

        for (const [index, { instanceId, propsKey, ...args }] of Object.entries(propsBindings))
          for (const child of Object.values(this.#children))
            if (child.#componentId === instanceId && child.#instanceId !== instanceId) {
              const _index: number = parseInt(index) + 1

              propsMap.set(ancestorId, [
                ...propsBindings.slice(0, _index),
                {
                  ...args,
                  instanceId: child.#instanceId,
                  propsKey,
                  setProps: (value: unknown) => child.#setProps(propsKey, value)
                },
                ...propsBindings.slice(_index)
              ])
            }

        this.#ancestorIds.push(ancestorId)
      }

      this.#ancestorIds.push(this.#instanceId)
      this.#isInitialized = true
    }
  }

  get #template(): string {
    const sanitized: unique symbol = Symbol(`${this.#instanceId}-sanitized`)
    const unsanitized: unique symbol = Symbol(`${this.#instanceId}-unsanitized`)

    const convertTemplate = (
      strings: TemplateStringsArray,
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

      for (const [index, template] of strings.entries()) sanitize(index, template, variables[index])

      return converted as HtmlContent<D, P>[]
    }

    for (const child of Object.values(this.#children))
      child.setIndividualProps = (key: string, props: P): FiCsElement<D, P> => {
        const instanceId: string = `${child.#instanceId}-${key}`
        const clonedSelf: Descendant | undefined = child.#clonedSelves.get(instanceId)
        const cloneProps = (descendant: Descendant): Descendant => {
          for (const [key, value] of Object.entries({ ...props })) descendant.#setProps(key, value)
          return descendant
        }

        if (clonedSelf) return cloneProps(clonedSelf)

        const cloneRecursively = (child: Descendant, instanceId: string): Descendant => {
          const cloned: Descendant = cloneProps(child.#clone(instanceId))

          for (const [key, _child] of Object.entries(cloned.#children))
            cloned.#children[key] = cloneRecursively(
              _child,
              `${_child.#instanceId}-in-${instanceId}`
            )

          child.#clonedSelves.set(instanceId, cloned)
          return cloned
        }

        return cloneRecursively(child, instanceId)
      }

    const { data, props, setData }: DataPropsMethods<D, P> = this.#getDataPropsMethods()
    const template: Syntaxes<D, P>['template'] = (
      strings: TemplateStringsArray,
      ...variables: (HtmlContent<D, P> | unknown)[]
    ): Sanitized<D, P> => ({ [sanitized]: convertTemplate(strings, variables) })

    const contents: HtmlContent<D, P>[] = this.#html({
      children: this.#children,
      data,
      props,
      setData,
      template: (
        strings: TemplateStringsArray,
        ...variables: (HtmlContent<D, P> | unknown)[]
      ): Sanitized<D, P> => template(strings, ...variables),
      html: (str: string): Record<symbol, string> => ({ [unsanitized]: str }),
      show: (condition: boolean): string => (condition ? '' : this.#showAttr),
      apiStatuses: Object.fromEntries(this.#apiStatuses),
      isBrowser: this.#isBrowser,
      isDeferred: this.#isDeferred,
      virtualScroll: <T>(
        array: T[],
        callback: (item: T, index: number) => Sanitized<D, P>
      ): Sanitized<D, P> => {
        if (!this.#scroll) return template`${array.map((item, index) => callback(item, index))}`

        const { unit, elementMinHeight, start, end, buffer, id }: Scroll<D, P> = this.#scroll

        numberError({ unit, elementMinHeight })
        if (buffer) numberError({ buffer }, false)

        const height: number = elementMinHeight * (end - start + (buffer ?? 0))
        const endIndex: number = Array.isArray(array) ? array.length : end

        return template`
          <div id="${id}" style="height:${height}px; overflow-y:auto;">
            ${array.slice(start, endIndex).map((item, index) => callback(item, index))}
          </div>
        `
      }
    })[sanitized]

    return contents.reduce((prev, curr) => {
      if (curr instanceof FiCsElement) {
        const instanceId: string = curr.#instanceId

        if (!(instanceId in this.#childrenStore)) this.#childrenStore[instanceId] = curr
        curr = `<${varTag} ${ficsIdName}="${instanceId}"></${varTag}>`
      }

      return `${prev}${curr}`
    }, '') as string
  }

  get #computedClassName(): string {
    if (!this.#classNames) return ''

    return checkType(this.#classNames, 'function')
      ? this.#classNames(this.#dataProps)
      : this.#classNames
  }

  #setClassNames(component: HTMLElement): void {
    if (!this.#classNames) return
    component.className = this.#computedClassName
  }

  get #computedAttrs(): [string, string][] {
    return Object.entries(
      checkType(this.#attrs, 'function') ? this.#attrs(this.#dataProps) : (this.#attrs ?? [])
    )
  }

  #setAttrs(component: HTMLElement): void {
    for (const [key, value] of this.#computedAttrs)
      component.setAttribute(convertStr(key, 'kebab'), value)
  }

  #getChildNodes(parent: DocumentFragment | ChildNode): ChildNode[] {
    return Array.from(parent.childNodes)
  }

  #removeChildNodes(target: HTMLElement | ChildNode[]): void {
    for (const childNode of target instanceof HTMLElement ? this.#getChildNodes(target) : target)
      childNode.remove()
  }

  #setProperty<V>(element: HTMLElement, property: string, value: V): void {
    ;(element as any)[convertStr(property, 'camel')] = value
  }

  #buildHtml(shadowRoot: ShadowRoot, isInitialized?: boolean): void {
    const isText = (childNode: ChildNode): childNode is Text => childNode instanceof Text
    const isElement = (childNode: ChildNode): childNode is Element => childNode instanceof Element
    const oldChildNodes: ChildNode[] = this.#getChildNodes(shadowRoot)
    const newChildNodes: ChildNode[] = this.#getChildNodes(
      document.createRange().createContextualFragment(this.#template)
    )

    const convertChildNodes = (childNodes: ChildNode[]): void => {
      for (let index = 0; index < childNodes.length; index++) {
        const childNode: ChildNode = childNodes[index]

        if (isText(childNode) && childNode.nodeValue) {
          childNode.nodeValue = childNode.nodeValue.trim()

          if (childNode.nodeValue === '') {
            childNode.parentNode?.removeChild(childNode)
            childNodes.splice(index, 1)
            index--
            continue
          }
        }

        if (isElement(childNode)) {
          if (childNode.localName === varTag) {
            const instanceId: string | null = childNode.getAttribute(ficsIdName)

            if (!instanceId || !(instanceId in this.#childrenStore))
              throw new Error(
                `The element ${childNode} does not have a valid instanceId in ${this.#name}...`
              )

            const child: FiCsElement<D, P> = this.#childrenStore[instanceId]
            child.#initProps(this.#propsChain, this.#ancestorIds)
            child.#callback('created')
            child.#enqueue(() => child.#define(), 'define')

            const component: HTMLElement = document.createElement(child.#name)
            child.#setClassNames(component)
            child.#setAttrs(component)
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
        if (
          isText(oldChildNode) &&
          isText(newChildNode) &&
          oldChildNode.nodeValue !== newChildNode.nodeValue
        )
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

                if (name !== ficsIdName) that.#setProperty(oldChildNode, name, value)
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
        let oldStartIndex: number = 0,
          oldEndIndex: number = oldChildNodes.length - 1,
          oldStartNode: ChildNode = oldChildNodes[oldStartIndex],
          oldEndNode: ChildNode = oldChildNodes[oldEndIndex],
          newStartIndex: number = 0,
          newEndIndex: number = newChildNodes.length - 1,
          newStartNode: ChildNode = newChildNodes[newStartIndex],
          newEndNode: ChildNode = newChildNodes[newEndIndex]
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
                  !!(oldChildNode as any)[convertStr(ficsIdName, 'camel')]
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
                let _oldStartIndex: number = oldStartIndex,
                  reference: Element | null = null

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

  #cssToString({ css, mode }: { css: Css<D, P>[]; mode: 'csr' | 'ssr' }): string {
    if (css.length === 0) return ''

    let topLevelCss: string = ''
    const convertCssContent = (style: Style<D, P>): string =>
      Object.entries(checkType(style, 'function') ? style(this.#dataProps) : style).reduce(
        (prev, [key, value]) => {
          if (checkType(value, 'undefined') || value === '' || isBlankObject(value)) return prev

          key = convertStr(key, 'kebab')
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

          _curr += `${selector}{${hostCssContent}${hostCssContent.length > 0 ? ';' : ''}${_selector}${content.slice(index)}}`
        } else _curr += `${selector}{${content}}`
      }

      return `${prev}${_curr}${topLevelCss}`
    }, '') as string
  }

  #buildCss(shadowRoot: ShadowRoot, additional: Css<D, P>[]): void {
    const css: Css<D, P>[] = [...globalCss(), ...this.#css]

    if (css.length === 0) return

    if (additional.length === 0)
      for (const [index, content] of this.#css.entries()) {
        if (checkType(content, 'string')) continue
        if (checkType(Object.values(content)[0], 'function')) this.#bindings.css.push(index)
      }

    const stylesheet: CSSStyleSheet = new CSSStyleSheet()
    shadowRoot.adoptedStyleSheets = [stylesheet]
    stylesheet.replaceSync(
      this.#cssToString({ css: [':host{display:block}', ...css], mode: 'csr' })
    )
  }

  #getShadowRoot(component: HTMLElement): ShadowRoot {
    if (component.shadowRoot) return component.shadowRoot

    throw new Error(`${this.#name} does not have shadowRoot...`)
  }

  #getElements(component: HTMLElement, selector: string): Element[] {
    if (selector === ':host') return [component]

    return Array.from(
      this.#getShadowRoot(component).querySelectorAll(
        selector.startsWith(':host') ? selector : `:host ${selector}`
      )
    )
  }

  #debounce<T extends (...args: any[]) => void>(
    func: T,
    time: number
  ): (...args: Parameters<T>) => void {
    numberError({ time }, false)

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
    numberError({ time }, false)

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
        throw new Error(
          'Both "debounce" and "throttle" options cannot be specified at the same time...'
        )

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

  #infiniteVirtualScroll(shadowRoot: ShadowRoot): void {
    if (this.#scroll.isEnabled === false) {
      const { id, rootMargin, trigger, throttle, method }: Scroll<D, P> = this.#scroll
      const _trigger: boolean | undefined = trigger?.({ data: this.#data })

      if (checkType(_trigger, 'undefined') || _trigger) {
        const root: HTMLElement | null = shadowRoot.getElementById(id)

        if (!root) throw new Error(`The "${id}" is not found in the shadowRoot of ${this.#name}...`)

        this.#addEventListener(root, [
          [
            'scroll',
            [
              ({ event }) => {
                const target = event.target as HTMLElement

                const { scrollTop, scrollHeight, clientHeight } = target
                console.log(scrollTop, scrollHeight, clientHeight)
              },
              { throttle: throttle ?? 0 }
            ]
          ]
        ])

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

  #openWebSocket(): WebSocket | undefined {
    const websocket: Options<D, P>['websocket'] | undefined = this.#options.websocket

    if (!websocket || isBlankObject(websocket)) return undefined

    const {
        path,
        protocols,
        reconnect,
        onopen,
        onmessage,
        onerror,
        onclose
      }: Options<D, P>['websocket'] = websocket,
      { protocol: _protocol, host }: { protocol: string; host: string } = window.location

    let reconnectedCount: number = 0,
      reconnectedTimer: Timer | null = null

    const connect = (): WebSocket => {
      const _websocket: WebSocket = new WebSocket(
          `${_protocol.replace('http', '_websocket')}//${host}${path}`,
          protocols
        ),
        params: () => Omit<WebSocketParams<D, P>, 'event'> = () => ({
          ...this.#getDataPropsMethods(true),
          websocket: {
            send: _websocket.send.bind(_websocket),
            readyState: () => _websocket.readyState,
            bufferedAmount: () => _websocket.bufferedAmount,
            binaryType: () => _websocket.binaryType,
            url: () => _websocket.url,
            protocol: () => _websocket.protocol,
            extensions: () => _websocket.extensions
          }
        })

      this.#websocket = {
        send: _websocket.send.bind(_websocket),
        isOpened: () => _websocket.readyState === WebSocket.OPEN
      }

      _websocket.onopen = (event: Event): void => {
        reconnectedCount = 0

        if (reconnectedTimer) {
          clearTimeout(reconnectedTimer)
          reconnectedTimer = null
        }

        onopen?.({ ...params(), event })
      }
      _websocket.onmessage = (event: MessageEvent): void => onmessage?.({ ...params(), event })

      const autoReconnect = (): void => {
        if (reconnect && !reconnectedTimer) {
          const {
            interval,
            max,
            isExponential
          }: NonNullable<Options<D, P>['websocket']>['reconnect'] = reconnect

          if ((max && reconnectedCount < max) || !max) {
            _websocket.close()

            reconnectedTimer = setTimeout(
              () => {
                reconnectedCount++
                connect()
              },
              isExponential ? interval ** reconnectedCount : interval
            )
          }
        }
      }

      _websocket.onerror = (event: Event): void => {
        onerror?.({ ...params(), event })
        autoReconnect()
      }
      _websocket.onclose = (event: CloseEvent): void => {
        onclose?.({ ...params(), event })
        autoReconnect()
      }

      return _websocket
    }

    return connect()
  }

  #openEventSource(): { eventSource: EventSource; removeEventListeners: () => void } | undefined {
    const sse: Options<D, P>['sse'] | undefined = this.#options.sse

    if (!sse || isBlankObject(sse)) return undefined

    const { path, withCredentials, onopen, onmessage, onerror, actions }: Options<D, P>['sse'] =
        sse,
      eventSource: EventSource = new EventSource(path, { withCredentials }),
      params: DataPropsMethods<D, P, true> = this.#getDataPropsMethods(true),
      listeners: { handler: string; callback: (event: MessageEvent) => void }[] = []

    eventSource.onopen = (event: Event): void => onopen?.({ ...params, event })
    eventSource.onmessage = (event: MessageEvent): void => onmessage?.({ ...params, event })
    eventSource.onerror = (event: Event): void => onerror?.({ ...params, event })

    const addEventListener = (
      handler: string,
      method: SSEMethod<D, P>,
      options?: ActionOptions
    ): void => {
      const { debounce, throttle, once }: ActionOptions = options ?? {}

      if (debounce && throttle)
        throw new Error(
          'Both "debounce" and "throttle" options cannot be specified at the same time...'
        )

      let callback: (event: MessageEvent) => void = (event: MessageEvent): void =>
        method({ ...this.#getDataPropsMethods(true), event })

      if (debounce) callback = this.#debounce(callback, debounce)
      else if (throttle) callback = this.#throttle(callback, throttle)

      eventSource.addEventListener(handler, callback, { once })
      listeners.push({ handler, callback })
    }

    for (const [handler, method] of Object.entries(actions))
      Array.isArray(method)
        ? addEventListener(handler, method[0], method[1])
        : addEventListener(handler, method)

    return {
      eventSource,
      removeEventListeners: () => {
        for (const { handler, callback } of listeners)
          eventSource.removeEventListener(handler, callback)
      }
    }
  }

  #callback(key: Exclude<keyof Hooks<D, P>, 'updated'>): void {
    if (this.#hooks?.[key] === undefined) return
    if (key === 'mounted') {
      const that: FiCsElement<D, P> = this,
        poll = (
          func: ({ times }: { times: number }) => void,
          { interval, max, exit }: PollingOptions
        ): void => {
          numberError({ interval, max })

          let times = 0

          const execute: ReturnType<typeof setTimeout> = setTimeout(function run() {
            if ((max && times >= max) || (exit && exit())) {
              clearTimeout(execute)
              return
            }

            func({ times })
            times++
            that.#poll = setTimeout(run, interval)
          }, interval)

          that.#poll = execute
        }

      this.#hooks[key]({ ...this.#getDataPropsMethods(true), poll })
    } else this.#hooks[key]({ ...this.#getDataPropsMethods(true) })
  }

  #define(): void {
    browserError()

    const that: FiCsElement<D, P> = this
    const { lazyLoad, rootMargin }: OptionParams<D, P> = that.#options

    window.customElements.define(
      that.#name,
      class extends HTMLElement {
        readonly #shadowRoot: ShadowRoot
        #isRendered: boolean = false
        #websocket?: WebSocket
        #eventSource?: EventSource
        #removeEventListeners?: () => void

        constructor() {
          super()
          this.#shadowRoot = this.attachShadow({ mode: 'open' })
          if (!lazyLoad) this.#init()
        }

        #init() {
          if (that.#deferredData || that.#i18nData)
            that.#enqueue(async () => {
              if (that.#deferredData)
                for (const [key, value] of Object.entries(
                  await that.#deferredData!({ ...that.#dataProps, crud: that.#crud.bind(that) })
                ))
                  that.#internalSetData(key as keyof D, value as D[keyof D])

              if (that.#i18nData)
                for (const [key, value] of Object.entries(
                  await that.#i18nData!({
                    ...that.#dataProps,
                    i18n: async <T>({ lang, key }: { lang: string; key: SingleOrArray<string> }) =>
                      i18n<T>({ lang, key })
                  })
                ))
                  that.#internalSetData(key as keyof D, value as D[keyof D])

              that.#isDeferred = true
            }, 'fetch')

          that.#buildHtml(this.#shadowRoot, true)
          that.#buildCss(this.#shadowRoot, [])

          for (const [selector, action] of Object.entries(that.#actions))
            for (const element of that.#getElements(this, selector))
              that.#addEventListener(element, Object.entries(action))

          that.#removeChildNodes(this)
          that.#setProperty(this, ficsIdName, that.#instanceId)

          if (that.#components.size === 0 && !that.#components.has(this)) that.#components.add(this)
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

            that.#setClassNames(this)
            that.#setAttrs(this)

            that.#infiniteVirtualScroll(this.#shadowRoot)

            this.#websocket = that.#openWebSocket()

            const {
              eventSource,
              removeEventListeners
            }: { eventSource?: EventSource; removeEventListeners?: () => void } =
              that.#openEventSource() || {}

            if (eventSource) this.#eventSource = eventSource
            if (removeEventListeners) this.#removeEventListeners = removeEventListeners

            that.#callback('mounted')
            this.#isRendered = true
          }
        }

        disconnectedCallback(): void {
          if (that.#poll) {
            clearTimeout(that.#poll)
            that.#poll = undefined
          }

          this.#websocket?.close()
          this.#eventSource?.close()
          this.#removeEventListeners?.()

          that.#callback('destroyed')
        }

        adoptedCallback(): void {
          that.#callback('adopted')
        }
      }
    )
  }

  async #reRender(isOnlyHtml?: boolean): Promise<void> {
    const component: HTMLElement | undefined = this.#components.values().next().value

    if (!component) return

    const { isClassName, isAttr, css }: Bindings = this.#bindings
    const shadowRoot: ShadowRoot = this.#getShadowRoot(component)

    if (this.#i18nData)
      for (const [key, value] of Object.entries(
        await this.#i18nData!({
          ...this.#dataProps,
          i18n: async <T>({ lang, key }: { lang: string; key: SingleOrArray<string> }) =>
            i18n<T>({ lang, key })
        })
      ))
        if (this.#data[key as keyof D] !== value)
          this.#internalSetData(key as keyof D, value as D[keyof D], true)

    if (!isOnlyHtml && isClassName) {
      component.classList.remove(...Array.from(component.classList))
      this.#setClassNames(component)
    }

    if (!isOnlyHtml && isAttr) this.#setAttrs(component)

    this.#buildHtml(shadowRoot)

    if (!isOnlyHtml && css.length > 0)
      this.#buildCss(
        shadowRoot,
        css.map(index => this.#css[index])
      )

    if (this.#isBrowser) {
      const addAllElements = (elements: Element[] | Set<Element>): void => {
        for (const element of elements) {
          if (element instanceof Element && !this.#newElements.has(element))
            this.#newElements.add(element)

          addAllElements(this.#getChildNodes(element) as Element[])
        }
      }

      addAllElements(this.#newElements)

      for (const [selector, action] of Object.entries(this.#actions))
        for (const element of this.#getElements(component, selector))
          if (this.#newElements.has(element))
            this.#addEventListener(element, Object.entries(action))

      this.#newElements.clear()
    }
  }

  getChildren(): Children {
    throw new Error(`The getChildren method is not implemented in the ${this.#name}...`)
  }

  setIndividualProps(_1: string, _2: P): FiCsElement<D, P> {
    throw new Error(`The setIndividualProps method is not implemented in the ${this.#name}...`)
  }

  toString(data?: Partial<D>): string {
    const render = (
      that: FiCsElement<D, P>,
      propsChain: PropsChain<P>,
      ancestorIds: string[],
      data?: Partial<D>
    ): string => {
      that.#initProps(propsChain, ancestorIds)

      if (that.#options.ssr) {
        const className: string = that.#classNames ? `class="${that.#computedClassName}"` : ''
        const value: string = `${className} ${that.#computedAttrs.reduce(
          (prev, [key, value]) => `${prev} ${convertStr(key, 'kebab')}="${value}"`,
          ''
        )}`.trim()
        const attrs = (name: string): string =>
          `id="${name}" slot="${name}"${data ? ` data-${name}='${JSON.stringify(data)}'` : ''}`

        const applyDescendant = (html: string): string => {
          const varBegin: string = `<${varTag} ${ficsIdName}="`
          const varEnd: string = `"></${varTag}>`

          const varBeginIndex: number = html.indexOf(varBegin)
          const varEndIndex: number = html.indexOf(varEnd)

          if (varBeginIndex < 0 || varEndIndex < 0) return html

          const prev: string = html.slice(0, varBeginIndex)
          const next: string = applyDescendant(html.slice(varEndIndex + varEnd.length))
          const instanceId: string = html.slice(varBeginIndex + varBegin.length, varEndIndex)

          if (!(instanceId in that.#childrenStore))
            throw new Error(`The element does not have a valid instanceId in ${that.#name}...`)

          return `${prev}${render(that.#childrenStore[instanceId], propsChain, ancestorIds)}${next}`
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

          let newPrev: string = `${prev.slice(0, styleIndex)}${styleAttr}`,
            remaining: string = prev.slice(styleIndex + styleAttr.length)
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
          applyDescendant(that.#template.replace(/>\s+</g, '><').replace(/\n\s/g, ''))
        )
        const css = (_css: Css<D, P>[]): string =>
          _css.length > 0 ? `<style>${that.#cssToString({ css: _css, mode: 'ssr' })}</style>` : ''

        return `
          <${that.#name}${value.length > 0 ? ` ${value}` : ''}>
            <template shadowrootmode="open"><slot name="${that.#name}"></slot></template>
            <div ${attrs(that.#name)}>${html}${css([...globalCss(), ...that.#css])}</div>
          </${that.#name}>
        `
      }

      return `<${that.#name}></${that.#name}>`
    }

    if (data)
      for (const [key, value] of Object.entries(data))
        this.setData(key as keyof D, value as D[keyof D])

    return render(this, this.#propsChain, this.#ancestorIds, data)
  }

  describe(parent?: HTMLElement): void {
    this.#initProps(this.#propsChain, this.#ancestorIds)
    this.#callback('created')
    this.#enqueue(() => this.#define(), 'define')
    if (parent) parent.append(document.createElement(this.#name))
  }

  setData<K extends keyof D>(key: K, value: D[K]): void {
    if (this.#nameKey === 'router' && (key === 'pathname' || key === 'queries'))
      throw new Error(`The "${key as string}" cannot be modified in the router component...`)
    this.#internalSetData(key, value)
  }

  getData<K extends keyof D>(key: K): D[K] {
    this.#throwKeyError(key)
    return this.#data[key]
  }
}
