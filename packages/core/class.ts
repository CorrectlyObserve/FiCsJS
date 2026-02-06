import consts from './constants'
import runCrud from './crud'
import {
  browserError,
  convertStr,
  deepEqual,
  isBlankObject,
  isBrowser,
  isObject,
  joinArray,
  numberError,
  toArray,
  typedEntries,
  uid
} from './helpers'
import { i18n } from './i18n'
import enqueue from './queue'
import openEventSource from './sse'
import openWebSocket from './websocket'
import type {
  Action,
  Attrs,
  Children,
  ClassName,
  Crud,
  Css,
  DataProps,
  Descendant,
  FiCs,
  Html,
  Hook,
  I18n,
  Options,
  Props,
  Scroll,
  SetTimeout,
  SingleOrArray,
  SSE,
  Task,
  WebSocket
} from './types'

export default class FiCsElement<D extends object, P extends object> {
  static #generator: Generator<number> = uid()
  static #nameGenerators: Map<string, Generator<number>> = new Map()
  static #activeContext: { instance: Descendant; updater: () => void } | null = null
  static globalCss: Css.Global[] = new Array()
  readonly #nameKey: string
  readonly #instanceId: string
  readonly #name: string
  readonly #children: Children = {}
  readonly #isBrowser: boolean
  readonly #rawData: D = {} as D
  readonly #data: D = {} as D
  readonly #subscribers: {
    data: Map<keyof D, Set<() => void>>
    props: Map<keyof P, Set<() => void>>
  } = { data: new Map(), props: new Map() }
  readonly #cache: {
    boundFunctions: Map<Function, D[keyof D] | P[keyof P]>
    component?: HTMLElement
  } = { boundFunctions: new Map() }
  readonly #deferredData?: (dataProps: DataProps<D, P, true>) => Promise<Partial<D>>
  readonly #i18nData?: (dataProps: DataProps<D, P, false> & I18n) => Promise<Partial<D>>
  readonly #propsSources: Props<D, P>[] = new Array()
  readonly #rawProps: P = {} as P
  readonly #props: P = {} as P
  readonly #classNames?: ClassName<D, P>
  readonly #attrs?: Attrs<D, P>
  readonly #html: Html.Core<D, P>
  readonly #showAttr: string
  readonly #css: Css.Sheet<D, P>[] = new Array()
  readonly #boundCss: number[] = new Array()
  readonly #hooks: Hook.Lifecycle<D, P> = {}
  readonly #actions: Action.Handlers<D, P> = {}
  readonly #options: Options.Resolved<D, P> = { ssr: true, lazyLoad: false, rootMargin: '0px' }
  readonly #apiStatuses: Map<string, boolean> = new Map()
  readonly #clonedSelves: Map<string, Descendant> = new Map()
  readonly #childrenStore: Record<string, FiCsElement<D, P>> = {}
  readonly #newElements: Set<Element> = new Set()
  #isDeferred: boolean = true
  #isInRerendering: boolean = false
  #isInitialized: boolean = false
  #webSocketProp?: WebSocketProp
  #scrollObservers?: {
    root: HTMLElement
    intersection: IntersectionObserver
    mutation: MutationObserver
  }
  #poll?: ReturnType<typeof setTimeout>
  #hasDescribed: boolean = false

  constructor({
    name,
    isExceptional,
    instanceId,
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
    options
  }: FiCs<D, P>) {
    name = name.trim()
    if (name === '') throw new Error('The FiCsElement name must be a non-empty string...')

    name = convertStr(name, 'kebab')
    this.#nameKey = convertStr(name, 'camel')

    if (!isExceptional && { var: true, router: true, link: true }[name])
      throw new Error(`The "${name}" is a reserved word in FiCsJS...`)

    this.#instanceId = instanceId ?? `${consts.FICS_ID_ATTR}${FiCsElement.#generator.next().value}`

    let generator: Generator<number> | undefined = FiCsElement.#nameGenerators.get(name)
    if (!generator) {
      generator = uid()
      FiCsElement.#nameGenerators.set(name, generator)
    }

    const count: number = generator.next().value
    this.#name = `f-${name}${count > 1 ? `${isBrowser() ? '' : '-server'}-${count}` : ''}`

    this.#isBrowser = isBrowser()

    if (options) {
      const { ssr, lazyLoad, rootMargin, websocket, sse, scroll }: Options.Ctx<D, P> = options

      if (name === 'router' || ssr === false || lazyLoad) this.#options.ssr = false
      if (lazyLoad) this.#options.lazyLoad = true

      if (rootMargin !== '' && rootMargin !== '0px' && rootMargin !== undefined) {
        if (!lazyLoad)
          throw new Error(
            `The "rootMargin" in options is enabled only if "lazyLoad" is set to true...`
          )

        this.#options.rootMargin = rootMargin
      }

      for (const [key, value] of typedEntries({ websocket, sse, scroll } as const)) {
        if (!value || isBlankObject(value) || !this.#isBrowser) continue

        switch (key) {
          case 'websocket':
            this.#options[key] = { ...value } as WebSocket.Options<D, P>
            break

          case 'sse':
            this.#options[key] = { ...value } as SSE.Options<D, P>
            break

          case 'scroll':
            this.#options[key] = {
              ...value,
              id: `${this.#instanceId}-scroll`,
              start: 0,
              end: (value as Options<D, P>[typeof key])?.unit,
              isEnabled: false,
              totalSize: NaN,
              elementSizes: new Map(),
              prevTotalSize: NaN
            } as Options<D, P>[typeof key]
            break
        }
      }
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

      for (let [key, value] of typedEntries({ ...data(), ...attrData } as D)) {
        this.#rawData[key] = value

        if ((deferredData || i18nData) && this.#isBrowser) {
          this.#isDeferred = false

          if (deferredData) this.#deferredData = deferredData
          if (i18nData) this.#i18nData = i18nData
        }
      }

      this.#data = new Proxy(this.#rawData, {
        get: (target, prop, receiver): D[keyof D] => {
          if (FiCsElement.#activeContext) {
            const key: keyof D = prop as keyof D

            if (!this.#subscribers.data.has(key)) this.#subscribers.data.set(key, new Set())
            this.#subscribers.data.get(key)!.add(FiCsElement.#activeContext.updater)
          }

          return this.#bindFunction(Reflect.get(target, prop, receiver)) as D[keyof D]
        },
        set: (_, prop, value): boolean => {
          const key: keyof D = prop as keyof D

          if (deepEqual(this.#rawData[key], value)) return true

          this.#rawData[key] = value

          const subscribers: Set<() => void> | undefined = this.#subscribers.data.get(key)
          if (subscribers) for (const updater of subscribers) updater()

          const updated: Hook.Lifecycle<D, P>['updated'] | undefined = this.#hooks.updated
          if (updated && key in updated)
            updated[key]!({
              ...this.#getDataProps(true),
              ref: (selector: string) => this.#queryDeeply(selector),
              debounce: this.#debounce.bind(this),
              throttle: this.#throttle.bind(this)
            })

          if (!this.#isInRerendering && this.#isBrowser && this.#cache.component)
            this.#enqueue(this.#reRender.bind(this), 're-render')

          return true
        }
      })
    }

    if (props) {
      const propsArray: Props<D, P>[] = toArray(props)
      if (propsArray.length > 0) this.#propsSources = propsArray
    }

    this.#props = new Proxy(this.#rawProps, {
      get: (target, prop, receiver): P[keyof P] => {
        if (FiCsElement.#activeContext) {
          const key: keyof P = prop as keyof P

          if (!this.#subscribers.props.has(key)) this.#subscribers.props.set(key, new Set())
          this.#subscribers.props.get(key)!.add(FiCsElement.#activeContext.updater)
        }

        return this.#bindFunction(Reflect.get(target, prop, receiver)) as P[keyof P]
      },
      set: (_, prop, value): true => {
        const key: keyof P = prop as keyof P

        if (deepEqual(this.#rawProps[key], value)) return true

        this.#rawProps[key] = value

        const subscribers: Set<() => void> | undefined = this.#subscribers.props.get(key)
        if (subscribers) for (const updater of subscribers) updater()

        if (this.#clonedSelves.size > 0)
          for (const clone of this.#clonedSelves.values()) clone.#props[key] = value

        if (this.#isBrowser && this.#cache.component)
          this.#enqueue(() => this.#reRender(), 're-render')

        return true
      }
    })

    if (className) this.#classNames = typeof className === 'function' ? className : className.trim()
    if (attributes) this.#attrs = attributes

    this.#html = html
    this.#showAttr = `${this.#instanceId}-show-syntax`

    if (css) this.#css = toArray(css)
    if (clonedCss) this.#css = [...clonedCss]

    if (hooks && !isBlankObject(hooks) && this.#isBrowser) this.#hooks = { ...hooks }
    if (actions && !isBlankObject(actions) && this.#isBrowser) this.#actions = { ...actions }
  }

  #clone(instanceId?: string): FiCsElement<D, P> {
    return new FiCsElement({
      name: this.#nameKey,
      isExceptional: true,
      instanceId: instanceId ?? this.#instanceId,
      children: Object.values(this.#children),
      data: () => this.#data as Partial<D>,
      deferredData: this.#deferredData,
      i18nData: this.#i18nData,
      props: this.#propsSources,
      className: this.#classNames,
      attributes: this.#attrs,
      html: this.#html,
      clonedCss: this.#css,
      actions: this.#actions,
      hooks: this.#hooks,
      options: this.#options
    })
  }

  #bindFunction(value: D[keyof D] | P[keyof P]): D[keyof D] | P[keyof P] {
    if (typeof value === 'function') {
      if (this.#cache.boundFunctions.has(value)) return this.#cache.boundFunctions.get(value)!

      const bound: D[keyof D] | P[keyof P] = value.bind(this)
      this.#cache.boundFunctions.set(value, bound)
      return bound
    }

    return value
  }

  #getDataProps<B extends boolean = false>(isCrud?: B): DataProps<D, P, B> {
    return {
      data: this.#data,
      props: this.#props,
      crud: isCrud ? this.#crud.bind(this) : undefined
    } as DataProps<D, P, B>
  }

  #enqueue(func: () => void, key: Task['key']): void {
    enqueue({ instanceId: this.#instanceId, func, key })
  }

  #crud<T>(api: string, options?: Crud.Options): Promise<T>
  #crud(api: string, options: Crud.StreamOptions): Promise<void>
  async #crud<T>(api: string, options?: Crud.Options | Crud.StreamOptions): Promise<T | void> {
    return await runCrud({
      api,
      apiStatuses: this.#apiStatuses,
      enqueue: this.#enqueue.bind(this),
      reRender: this.#reRender.bind(this),
      options
    })
  }

  #removePublicMethod = ({
    children,
    method
  }: {
    children?: Children
    method: 'getChildren' | 'setIndividualProps'
  }): void => {
    for (const child of Object.values(children ?? this.#children)) {
      if (Object.prototype.hasOwnProperty.call(child, method))
        if (method === 'getChildren') delete (child as { getChildren?: () => Children }).getChildren
        else if (method === 'setIndividualProps')
          delete (
            child as { setIndividualProps?: (key: string | number, props: P) => FiCsElement<D, P> }
          ).setIndividualProps

      this.#removePublicMethod({ children: child.#children, method })
    }
  }

  #addSetIndividualProps = (): void => {
    for (const child of Object.values(this.#children))
      child.setIndividualProps = (key: string | number, props: P): FiCsElement<D, P> => {
        const instanceId: string = `${child.#instanceId}-${key}`,
          clonedSelf: Descendant | undefined = child.#clonedSelves.get(instanceId),
          cloneProps = (descendant: Descendant): Descendant => {
            for (const [key, value] of Object.entries(child.#rawProps))
              if (!(key in props)) descendant.#props[key] = value

            for (const [key, value] of Object.entries({ ...props })) descendant.#props[key] = value

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
  }

  #initProps(): void {
    if (this.#isInitialized) return

    const addGetChildren = (children: Children = this.#children): void => {
      for (const child of Object.values(children)) {
        child.getChildren = (): Children => child.#children
        addGetChildren(child.getChildren())
      }
    }

    for (const { descendant, values } of this.#propsSources) {
      addGetChildren()

      const descendants: Descendant[] = toArray(descendant({ children: this.#children })).filter(
        (descendant: Descendant): descendant is Descendant => descendant !== undefined
      )

      this.#removePublicMethod({ method: 'getChildren' })

      if (descendants.length === 0) continue

      const updater = (): void => {
        FiCsElement.#activeContext = { instance: this, updater }

        try {
          for (const _descendant of descendants)
            for (const [key, value] of Object.entries(
              values({
                ...this.#getDataProps(true),
                children: this.#children,
                sendToWebsocket: (value: WebSocketValue) =>
                  this.#webSocketProp?.isOpened() && this.#webSocketProp.send(value)
              })
            ))
              _descendant.#props[key] = value
        } finally {
          FiCsElement.#activeContext = null
        }
      }

      updater()
    }

    this.#addSetIndividualProps()
    this.#removePublicMethod({ method: 'setIndividualProps' })
    this.#isInitialized = true
  }

  get #computedClassName(): string {
    if (!this.#classNames) return ''

    const classNames: string =
      typeof this.#classNames === 'function'
        ? this.#classNames(this.#getDataProps())
        : this.#classNames

    return classNames.trim()
  }

  #setClassNames(component: HTMLElement): void {
    const oldClassNames: string[] = Array.from(component.classList),
      newClassNames: Set<string> =
        this.#computedClassName === '' ? new Set() : new Set(this.#computedClassName.split(/\s+/))

    for (const className of newClassNames)
      if (!component.classList.contains(className)) component.classList.add(className)

    for (const className of oldClassNames)
      if (!newClassNames.has(className)) component.classList.remove(className)

    if (component.classList.length === 0) component.removeAttribute('class')
  }

  get #computedAttrs(): [string, string][] {
    if (!this.#attrs) return []

    const attrs: [string, string][] = []
    for (const [key, value] of Object.entries(
      typeof this.#attrs === 'function' ? this.#attrs(this.#getDataProps()) : this.#attrs
    ))
      attrs.push([key.trim(), value.trim()])

    return attrs
  }

  #isBooleanAttr(attr: string, value: string): boolean {
    return attr !== 'class' && attr !== 'value' && value === ''
  }

  #setAttrs(component: HTMLElement): void {
    const { attributes }: { attributes: NamedNodeMap } = component,
      oldAttrs: Record<string, string> = {},
      newAttrNames: Set<string> = new Set()

    for (let index = 0; index < attributes.length; index++) {
      const { name, value }: { name: string; value: string } = attributes[index]
      oldAttrs[name] = value
    }

    for (let [key, value] of this.#computedAttrs) {
      if (oldAttrs[key] !== value)
        if (this.#isBooleanAttr(key, value)) Reflect.set(component, convertStr(key, 'camel'), true)
        else component.setAttribute(key, value)

      newAttrNames.add(key)
    }

    for (const key in oldAttrs)
      if (key !== 'class' && !newAttrNames.has(key)) component.removeAttribute(key)
  }

  #getChildNodes(parent: DocumentFragment | ChildNode): ChildNode[] {
    return Array.from(parent.childNodes)
  }

  get #template(): string {
    const sanitized: unique symbol = Symbol.for(`__${this.#instanceId}-sanitized__`),
      unsanitized: unique symbol = Symbol.for(`__${this.#instanceId}-unsanitized__`),
      convertTemplate = (
        strings: TemplateStringsArray,
        variables: (Html.Content<D, P> | unknown)[]
      ): Html.Content<D, P>[] => {
        const converted: Html.Content<D, P>[] = new Array(),
          isSymbol = (variable: unknown, symbol: symbol): boolean =>
            !!(variable && isObject(variable) && symbol in variable),
          sanitize = (index: number, template: string, variable: unknown): void => {
            if (isSymbol(variable, sanitized))
              converted.push(template, ...(variable as Html.Sanitized<D, P>)[sanitized])
            else if (Array.isArray(variable)) {
              converted.push(template)
              for (const child of variable) sanitize(index, '', child)
            } else if (isSymbol(variable, unsanitized))
              converted.push(template, (variable as Record<symbol, string>)[unsanitized])
            else {
              if (template !== '') converted.push(template)

              variable =
                typeof variable === 'string'
                  ? variable.replace(/[<>]/g, tag => (tag === '<' ? '&lt;' : '&gt;'))
                  : (variable ?? '')

              if (variable !== '') converted.push(variable as Html.Content<D, P>)
            }
          }

        for (const [index, template] of strings.entries())
          sanitize(index, template, variables[index])

        return converted as Html.Content<D, P>[]
      }

    this.#addSetIndividualProps()

    const template: Html.Syntaxes<D, P>['template'] = (
      strings: TemplateStringsArray,
      ...variables: (Html.Content<D, P> | unknown)[]
    ): Html.Sanitized<D, P> => ({ [sanitized]: convertTemplate(strings, variables) })

    const contents: Html.Content<D, P>[] = this.#html({
      ...this.#getDataProps(),
      children: this.#children,
      crud: this.#crud.bind(this),
      template: (
        strings: TemplateStringsArray,
        ...variables: (Html.Content<D, P> | unknown)[]
      ): Html.Sanitized<D, P> => template(strings, ...variables),
      html: (str: string): Record<symbol, string> => ({ [unsanitized]: str }),
      show: (condition: boolean): string => (condition ? '' : this.#showAttr),
      apiStatuses: Object.fromEntries(this.#apiStatuses),
      attributes: {
        boolean: (condition: boolean | undefined): 'true' | 'false' =>
          condition ? 'true' : 'false',
        statusLiveRegion: consts.a11y.STATUS_LIVE_REGION
      },
      isBrowser: this.#isBrowser,
      isDeferred: this.#isDeferred,
      scroll: <T>(
        array: T[],
        callback: (item: T, index: number) => Sanitized<D, P>
      ): Sanitized<D, P> => {
        if (!this.#options.scroll)
          return template`${array.map((item, index) => callback(item, index))}`

        const { unit, elementMinSize, axis, start, end, buffer, id }: Scroll<D, P> =
          this.#options.scroll

        numberError({ unit, elementMinSize })
        if (buffer) numberError({ buffer }, false)

        const isVertical: boolean =
            (typeof axis === 'function' ? axis({ data: this.#data }) : axis) === 'vertical',
          style: string[] = [
            `${isVertical ? 'height' : 'width'}:${
              elementMinSize * (end - start + (buffer ?? 0))
            }px;`,
            `overflow-${isVertical ? 'y' : 'x'}:auto;`,
            isVertical ? '' : 'display:flex;margin-inline:auto;'
          ]

        return template`
          <div id="${id}" style="${joinArray(style)}">
            ${array.slice(start, Math.min(end, array.length)).map((item, index) => callback(item, index))}
          </div>
        `
      }
    })[sanitized]

    return contents.reduce((prev, curr) => {
      if (curr instanceof FiCsElement) {
        const instanceId: string = curr.#instanceId

        if (!(instanceId in this.#childrenStore)) this.#childrenStore[instanceId] = curr
        curr = `<${consts.VAR_TAG_NAME} ${consts.FICS_ID_ATTR}="${instanceId}"></${consts.VAR_TAG_NAME}>`
      }

      return `${prev}${curr}`
    }, '') as string
  }

  #removeChildNodes(target: HTMLElement | ChildNode[]): void {
    for (const childNode of target instanceof HTMLElement ? this.#getChildNodes(target) : target)
      childNode.remove()
  }

  #buildHtml(shadowRoot: ShadowRoot, isInitialized?: boolean): void {
    const oldChildNodes: ChildNode[] = this.#getChildNodes(shadowRoot),
      newChildNodes: ChildNode[] = this.#getChildNodes(
        document.createRange().createContextualFragment(this.#template)
      ),
      isText = (childNode: ChildNode): childNode is Text => childNode instanceof Text,
      isElement = (childNode: ChildNode): childNode is Element => childNode instanceof Element,
      isHTMLElement = (childNode: ChildNode | ParentNode): childNode is HTMLElement =>
        childNode instanceof HTMLElement,
      isTextarea = (childNode: ChildNode | ParentNode): childNode is HTMLTextAreaElement =>
        isHTMLElement(childNode) && childNode.localName === 'textarea'

    const convertChildNodes = (childNodes: ChildNode[]): void => {
      for (let index = 0; index < childNodes.length; index++) {
        const childNode: ChildNode = childNodes[index],
          parentNode: ParentNode | null = childNode.parentNode

        if (
          isText(childNode) &&
          childNode?.nodeValue === '' &&
          (!parentNode || !isTextarea(parentNode))
        ) {
          childNode.parentNode?.removeChild(childNode)
          childNodes.splice(index, 1)
          index--
          continue
        }

        if (isElement(childNode)) {
          if (childNode.localName === consts.VAR_TAG_NAME) {
            const instanceId: string | null = childNode.getAttribute(consts.FICS_ID_ATTR)

            if (!instanceId || !(instanceId in this.#childrenStore))
              throw new Error(
                `The element ${childNode} does not have a valid instanceId in ${this.#name}...`
              )

            const child: FiCsElement<D, P> = this.#childrenStore[instanceId]

            if (!child.#cache.component) {
              child.#initProps()
              child.#callback('created', shadowRoot)
              child.#enqueue(() => child.#define(), 'define')
            }

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
          oldChildNode.nodeName === newChildNode.nodeName,
        getKey = (element: Element): string | null => element.getAttribute('key')

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
          const { attributes: oldAttrs }: { attributes: NamedNodeMap } = oldChildNode,
            { attributes: newAttrs }: { attributes: NamedNodeMap } = newChildNode,
            oldAttrList: Record<string, Omit<Html.PickedAttr, 'name'>> = {}

          for (let i = 0; i < oldAttrs.length; i++) {
            const { name, value, namespaceURI, localName }: Html.PickedAttr = oldAttrs[i]
            oldAttrList[name] = { value, namespaceURI, localName }
          }

          for (let i = 0; i < newAttrs.length; i++) {
            const { name, value, namespaceURI }: Html.PickedAttr = newAttrs[i]

            if (oldAttrList[name]?.value !== value)
              if (isHTMLElement(oldChildNode)) {
                const prop: string = convertStr(name, 'camel'),
                  isBoolean: boolean = that.#isBooleanAttr(name, value)

                if (name !== consts.FICS_ID_ATTR && prop in oldChildNode)
                  Reflect.set(oldChildNode, prop, isBoolean ? true : value)
                else if (!isBoolean) oldChildNode.setAttribute(name, value)
              } else if (namespaceURI) oldChildNode.setAttributeNS(namespaceURI, name, value)
              else oldChildNode.setAttribute(name, value)

            delete oldAttrList[name]
          }

          for (const name in oldAttrList)
            if (isHTMLElement(oldChildNode)) oldChildNode.removeAttribute(name)
            else {
              const { namespaceURI, localName }: Omit<Html.PickedAttr, 'name'> = oldAttrList[name]

              if (namespaceURI) oldChildNode.removeAttributeNS(namespaceURI, localName)
              else oldChildNode.removeAttribute(name)
            }

          if (isTextarea(oldChildNode) && isTextarea(newChildNode)) {
            oldChildNode.value = newChildNode.value
            return
          }

          if (!!Reflect.get(oldChildNode, convertStr(consts.FICS_ID_ATTR, 'camel'))) return

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
        if (
          parentNode instanceof Element &&
          parentNode.getAttribute(that.#getScrollAttr('wrap', false)) === 'true'
        ) {
          for (const childNode of oldChildNodes) childNode.remove()
          for (const childNode of newChildNodes) {
            if (isElement(childNode) && !childNode.isConnected) that.#newElements.add(childNode)
            parentNode.appendChild(childNode)
          }
          return
        }

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

          const { localName }: { localName: string } = newChildNode,
            key: string = getKey(newChildNode) ?? localName

          if (keys[key])
            console.warn(
              (newChildNode.hasAttribute('key')
                ? `The key "${key}" in multiple ${localName} elements are duplicated.`
                : `There are multiple ${localName} elements that don't have keys.`) +
                ' therefore, the difference detection might not be working correctly...'
            )
          else keys[key] = true
        }

        const dom: Map<string, ChildNode[]> = new Map(),
          keyChildNodes: Map<string, ChildNode> = new Map()

        const insertBefore = (childNode: ChildNode, before: ChildNode | null): void => {
          if (isElement(childNode) && !childNode.isConnected) that.#newElements.add(childNode)

          parentNode.insertBefore(
            childNode,
            before && !before.parentNode?.isEqualNode(parentNode) ? null : before
          )
        }

        const focusNode = (childNode: ChildNode): void => {
          if (
            activeElement &&
            isHTMLElement(childNode) &&
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
          const { nodeName }: { nodeName: string } = childNode,
            key: string | null = isElement(childNode) ? getKey(childNode) : null

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
                  !!Reflect.get(oldChildNode, convertStr(consts.FICS_ID_ATTR, 'camel'))
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

                  if (key && Number.isFinite(parseInt(key))) key = parseInt(key)
                  return key
                },
                key: string | number | null = _getKey(newStartNode)

              if (typeof key === 'number') {
                let _oldStartIndex: number = oldStartIndex,
                  reference: Element | null = null

                while (_oldStartIndex <= oldEndIndex) {
                  const childNode = oldChildNodes[_oldStartIndex++]

                  if (isElement(childNode)) {
                    const _key: string | number | null = _getKey(childNode)

                    if (
                      isSameNode(newStartNode, childNode) &&
                      typeof _key === 'number' &&
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

  #cssToString(css: Css.Sheet<D, P>[], isSsr?: boolean): string {
    if (css.length === 0) return ''

    let topLevelCss: string = ''
    const convertCssContent = (style: Css.Value<D, P>): string =>
      Object.entries(typeof style === 'function' ? style(this.#getDataProps()) : style).reduce(
        (prev, [key, value]) => {
          if (value === undefined || value === '' || isBlankObject(value)) return prev

          key = convertStr(key, 'kebab')
          if (key.startsWith('webkit')) key = `-${key}`

          if (key.startsWith('@keyframes')) {
            topLevelCss += `${key}{${convertCssContent(value as Css.Value<D, P>)}}`
            return prev
          }

          const isApplicableType: boolean = typeof value === 'string' || typeof value === 'number'
          return `${prev}${key}${isApplicableType ? `:${value};` : `{${convertCssContent(value as Css.Declarations)}}`}`
        },
        ''
      )

    return css.reduce((prev, curr) => {
      if (typeof curr === 'string') return `${prev}${curr}`

      let _curr: string = ''

      for (let [selector, style] of Object.entries(curr)) {
        if (isSsr && selector.startsWith(consts.HOST_SELECTOR))
          selector = selector.replace(consts.HOST_SELECTOR, `div#${this.#name}`)

        const content: string = convertCssContent(style),
          index: number = content.indexOf('{')

        if (selector.startsWith(consts.HOST_SELECTOR) && index > -1) {
          const hostCss: string = content.slice(0, index),
            lastIndex: number = hostCss.lastIndexOf(';'),
            hostCssContent: string = hostCss.slice(0, lastIndex - hostCss.length),
            _selector: string = hostCss.slice(lastIndex + 1)

          _curr += `${selector}{${hostCssContent}${hostCssContent.length > 0 ? ';' : ''}${_selector}${content.slice(index)}}`
        } else _curr += `${selector}{${content}}`
      }

      return `${prev}${_curr}${topLevelCss}`
    }, '') as string
  }

  #buildCss(shadowRoot: ShadowRoot, additional: Css.Sheet<D, P>[]): void {
    const css: Css.Sheet<D, P>[] = [...FiCsElement.globalCss, ...this.#css]

    if (css.length === 0) return

    if (additional.length === 0)
      for (const [index, content] of this.#css.entries()) {
        if (typeof content === 'string') continue
        if (typeof Object.values(content)[0] === 'function') this.#boundCss.push(index)
      }

    const stylesheet: CSSStyleSheet = new CSSStyleSheet()
    shadowRoot.adoptedStyleSheets = [stylesheet]
    stylesheet.replaceSync(this.#cssToString([`${consts.HOST_SELECTOR}{display:block}`, ...css]))
  }

  #getShadowRoot(component: HTMLElement): ShadowRoot {
    if (component.shadowRoot) return component.shadowRoot

    throw new Error(`${this.#name} does not have shadowRoot...`)
  }

  #getElements(component: HTMLElement, selector: string): Element[] {
    if (selector === consts.HOST_SELECTOR) return [component]

    return Array.from(
      this.#getShadowRoot(component).querySelectorAll(
        selector.startsWith(consts.HOST_SELECTOR) ? selector : `${consts.HOST_SELECTOR} ${selector}`
      )
    )
  }

  #queryDeeply<T extends Element = Element>(selector: string, shadowRoot?: ShadowRoot): T | null {
    const searchedShadowRoots: Set<ShadowRoot> = new Set<ShadowRoot>(),
      searchRecursively = (shadowRoot?: ShadowRoot): T | null => {
        if (!shadowRoot || searchedShadowRoots.has(shadowRoot)) return null
        searchedShadowRoots.add(shadowRoot)

        const searched = shadowRoot.querySelector(selector) as T | null
        if (searched) return searched

        const treeWalker: TreeWalker = document.createTreeWalker(
          shadowRoot,
          NodeFilter.SHOW_ELEMENT
        )
        let element: HTMLElement | null = treeWalker.nextNode() as HTMLElement | null

        while (element) {
          if (element.nodeName.toLowerCase().startsWith('f-')) {
            const nested: T | null = searchRecursively(this.#getShadowRoot(element))
            if (nested) return nested
          }

          element = treeWalker.nextNode() as HTMLElement | null
        }

        return null
      }

    if (shadowRoot) return searchRecursively(shadowRoot)
    return searchRecursively(
      this.#cache.component ? this.#getShadowRoot(this.#cache.component) : undefined
    )
  }

  #debounce<T extends (...args: Parameters<T>) => void>(
    func: T,
    time: number
  ): (...args: Parameters<T>) => void {
    numberError({ time }, false)

    let timeout: SetTimeout | undefined

    return (...args: Parameters<T>): void => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), time)
    }
  }

  #throttle<T extends (...args: Parameters<T>) => void>(
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

  #addEventListener({
    element,
    shadowRoot,
    entries
  }: {
    element: Element
    shadowRoot: ShadowRoot
    entries: [string, Action.Method<D, P> | [Action.Method<D, P>, Action.Options]][]
  }) {
    const addEventListener = (
      handler: string,
      method: Action.Method<D, P>,
      options?: Action.Options
    ): void => {
      if (handler !== 'click' && options?.blur)
        throw new Error('The "blur" is enabled only if the handler is click...')

      const attrs: Record<string, string> = {}

      for (let index = 0; index < element.attributes.length; index++) {
        const { name, value }: { name: string; value: string } = element.attributes[index]
        attrs[name] = value
      }

      const { debounce, throttle, blur, once }: Action.Options = options ?? {}

      if (debounce && throttle)
        throw new Error('Both "debounce" and "throttle" options cannot be used at the same time...')

      const callback = (event: Event): void => {
        method({
          ...this.#getDataProps(true),
          event,
          ref: (selector: string) => this.#queryDeeply(selector, shadowRoot),
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

        if (!blur) return

        const { currentTarget }: { currentTarget: EventTarget | null } = event
        if (!(currentTarget instanceof HTMLElement) || document.activeElement !== currentTarget)
          return

        if ((event as MouseEvent).detail > 0) currentTarget.blur()
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
    if (!this.#options.scroll) return

    const { id, trigger, parameter, rootMargin, throttle, method }: Scroll<D, P> =
        this.#options.scroll,
      _trigger: boolean | undefined = trigger?.({ data: this.#data })

    if (_trigger === false) return

    const root: HTMLElement | null = shadowRoot.getElementById(id)
    if (!root) throw new Error(`The "${id}" was not found in the shadowRoot of ${this.#name}...`)

    if (this.#options.scroll.isEnabled && this.#scrollObservers?.root === root) return

    if (this.#scrollObservers) {
      this.#scrollObservers.intersection.disconnect()
      this.#scrollObservers.mutation.disconnect()
      this.#scrollObservers = undefined
      this.#options.scroll.isEnabled = false
    }

    this.#addEventListener({
      element: root,
      shadowRoot,
      entries: [
        [
          'scroll',
          [
            ({ event }) => {
              const { scrollTop, scrollHeight, clientHeight } = event.currentTarget as HTMLElement

              console.log(scrollTop, scrollHeight, clientHeight)
            },
            { throttle: throttle ?? 0 }
          ]
        ]
      ]
    })

    let { lastElementChild: lastChild }: { lastElementChild: Element | null } = root
    if (!lastChild) return

    let pageParam: number = 1

    if (parameter) {
      const url: URL = new URL(window.location.href),
        value: string | null = url.searchParams.get(parameter)

      if (value) {
        const numValue: number = Number(value)

        numberError({ [parameter]: numValue })
        pageParam = numValue
      }
    }

    const intersectionObserver: IntersectionObserver = new IntersectionObserver(
      ([{ isIntersecting }]) => {
        if (!isIntersecting) return

        method(this.#getDataProps(true))

        if (parameter) {
          const url: URL = new URL(window.location.href)

          if (pageParam === 1) pageParam++

          url.searchParams.set(parameter, (pageParam++).toString())
          window.history.replaceState(null, '', url.toString())
        }
      },
      { rootMargin }
    )
    const mutationObserver: MutationObserver = new MutationObserver(() => {
      const { lastElementChild }: { lastElementChild: Element | null } = root

      if (lastElementChild && lastElementChild !== lastChild) {
        if (lastChild) intersectionObserver.unobserve(lastChild)
        intersectionObserver.observe(lastElementChild)
        lastChild = lastElementChild
      }
    })

    intersectionObserver.observe(lastChild)
    mutationObserver.observe(root, { childList: true })
    this.#scrollObservers = { root, intersection: intersectionObserver, mutation: mutationObserver }
    this.#options.scroll.isEnabled = true
  }

  #openWebSocket(): WebSocket | undefined {
    const websocket: Options<D, P>['websocket'] | undefined = this.#options.websocket

    if (!websocket || isBlankObject(websocket)) return undefined

    let reconnectedCount: number = 0,
      reconnectedTimer: Timer | null = null

    const {
        path,
        protocols,
        reconnect,
        onopen,
        onmessage,
        onerror,
        onclose
      }: Options<D, P>['websocket'] = websocket,
      { protocol: _protocol, host }: { protocol: string; host: string } = window.location,
      connect = (): WebSocket => {
        const _websocket: WebSocket = new WebSocket(
            `${_protocol.replace('http', 'ws')}//${host}${path}`,
            protocols
          ),
          params: () => Omit<WebSocketParams<D, P>, 'event'> = () => ({
            ...this.#getDataProps(true),
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
      listeners: { handler: string; callback: (event: MessageEvent) => void }[] = [],
      removeEventListeners = () => {
        for (const { handler, callback } of listeners)
          eventSource.removeEventListener(handler, callback)
      },
      getParams = (): DataProps<D, P, true> & { close: () => void } => ({
        ...this.#getDataProps(true),
        close: () => {
          removeEventListeners()
          eventSource.close()
        }
      })

    eventSource.onopen = (event: Event): void => onopen?.({ ...getParams(), event })
    eventSource.onmessage = (event: MessageEvent): void => onmessage?.({ ...getParams(), event })
    eventSource.onerror = (event: Event): void => onerror?.({ ...getParams(), event })

    const addEventListener = (
      handler: string,
      method: SSEMethod<D, P>,
      options?: ActionOptions
    ): void => {
      const { debounce, throttle, once }: ActionOptions = options ?? {}

      if (debounce && throttle)
        throw new Error('Both "debounce" and "throttle" options cannot be used at the same time...')

      let callback: (event: MessageEvent) => void = (event: MessageEvent): void =>
        method({ ...getParams(), event })

      if (debounce) callback = this.#debounce(callback, debounce)
      else if (throttle) callback = this.#throttle(callback, throttle)

      eventSource.addEventListener(handler, callback, { once })
      listeners.push({ handler, callback })
    }

    for (const [handler, method] of Object.entries(actions))
      Array.isArray(method)
        ? addEventListener(handler, method[0], method[1])
        : addEventListener(handler, method)

    return { eventSource, removeEventListeners }
  }

  #callback(key: Exclude<keyof Hook.Lifecycle<D, P>, 'updated'>, shadowRoot?: ShadowRoot): void {
    if (this.#hooks?.[key] === undefined) return

    const ctx: Hook.Ctx<D, P> = {
      ...this.#getDataProps(true),
      ref: (selector: string) => this.#queryDeeply(selector, shadowRoot),
      debounce: this.#debounce.bind(this),
      throttle: this.#throttle.bind(this)
    }

    if (key === 'mounted') {
      const that: FiCsElement<D, P> = this,
        poll = (
          func: ({ times }: { times: number }) => void,
          { interval, max, exit }: Hook.Polling
        ): void => {
          numberError({ interval, max })

          let times: number = 0
          const execute: SetTimeout = setTimeout(function run() {
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

      this.#hooks[key]({ ...ctx, poll })
    } else this.#hooks[key](ctx)
  }

  #define(): void {
    browserError()

    const that: FiCsElement<D, P> = this,
      { lazyLoad, rootMargin }: Options.Ctx<D, P> = that.#options

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
        }

        #init() {
          if (that.#deferredData || that.#i18nData)
            that.#enqueue(async () => {
              if (that.#deferredData)
                for (const [key, value] of typedEntries(
                  (await that.#deferredData(that.#getDataProps(true))) as D
                ))
                  that.#data[key] = value

              if (that.#i18nData)
                for (const [key, value] of Object.entries(
                  await that.#i18nData({
                    ...that.#getDataProps(),
                    i18n: async <T>({ lang, key }: { lang: string; key: SingleOrArray<string> }) =>
                      i18n<T>({ lang, key })
                  })
                ))
                  that.#data[key as keyof D] = value as D[keyof D]

              that.#isDeferred = true
            }, 'fetch')

          that.#setClassNames(this)
          that.#setAttrs(this)
          that.#buildHtml(this.#shadowRoot, true)
          that.#buildCss(this.#shadowRoot, [])

          for (const [selector, action] of Object.entries(that.#actions))
            for (const element of that.#getElements(this, selector))
              that.#addEventListener({
                element,
                shadowRoot: this.#shadowRoot,
                entries: Object.entries(action)
              })

          that.#removeChildNodes(this)
          Reflect.set(this, convertStr(consts.FICS_ID_ATTR, 'camel'), that.#instanceId)

          that.#cache.component = this

          that.#infiniteVirtualScroll(this.#shadowRoot)

          this.#websocket = openWebSocket({
            options: that.#options.websocket,
            getDataProps: that.#getDataProps.bind(that),
            setWebSocketProp: (prop: WebSocket.Prop | undefined) => (that.#webSocketProp = prop)
          })

          const {
            eventSource,
            removeEventListeners
          }: { eventSource?: EventSource; removeEventListeners?: () => void } =
            openEventSource({
              options: that.#options.sse,
              getDataProps: that.#getDataProps.bind(that),
              debounce: that.#debounce.bind(that),
              throttle: that.#throttle.bind(that)
            }) || {}

          if (eventSource) this.#eventSource = eventSource
          if (removeEventListeners) this.#removeEventListeners = removeEventListeners
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

              setTimeout(() => observer.observe(this))
            } else this.#init()

            that.#callback('mounted', this.#shadowRoot)
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

          that.#callback('destroyed', this.#shadowRoot)
        }

        adoptedCallback(): void {
          that.#callback('adopted', this.#shadowRoot)
        }
      }
    )
  }

  async #reRender(isOnlyHtml?: boolean): Promise<void> {
    this.#isInRerendering = true

    try {
      const { component }: { component?: HTMLElement } = this.#cache
      if (!component) return

      if (this.#i18nData)
        for (const [key, value] of Object.entries(
          await this.#i18nData({
            ...this.#getDataProps(),
            i18n: async <T>({ lang, key }: { lang: string; key: SingleOrArray<string> }) =>
              i18n<T>({ lang, key })
          })
        )) {
          const _key: keyof D = key as keyof D
          if (!deepEqual(this.#data[_key], value)) this.#data[_key] = value as D[keyof D]
        }

      if (!isOnlyHtml) {
        this.#setClassNames(component)
        this.#setAttrs(component)
      }

      const shadowRoot: ShadowRoot = this.#getShadowRoot(component)

      this.#buildHtml(shadowRoot)
      this.#infiniteVirtualScroll(shadowRoot)

      if (!isOnlyHtml && this.#boundCss.length > 0)
        this.#buildCss(
          shadowRoot,
          this.#boundCss.map(index => this.#css[index])
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
              this.#addEventListener({ element, shadowRoot, entries: Object.entries(action) })

        this.#newElements.clear()
      }
    } finally {
      this.#isInRerendering = false
    }
  }

  getChildren(): Children {
    throw new Error(`The getChildren method is not implemented in the ${this.#name}...`)
  }

  setIndividualProps(_1: string | number, _2: P): FiCsElement<D, P> {
    throw new Error(`The setIndividualProps method is not implemented in the ${this.#name}...`)
  }

  toString(data?: Partial<D>): string {
    const render = (that: FiCsElement<D, P>, data?: Partial<D>): string => {
      that.#initProps()

      if (!that.#options.ssr) return `<${that.#name}></${that.#name}>`

      const className: string = that.#classNames ? `class="${that.#computedClassName}"` : '',
        classNameAndAttrs: string = `${className} ${that.#computedAttrs.reduce(
          (prev, [key, value]) => `${prev} ${key}="${value}"`,
          ''
        )}`.trim(),
        slotAttrs: string = joinArray([
          `id="${that.#name}"`,
          `slot="${that.#instanceId}"`,
          `${data ? `data-${that.#name}='${JSON.stringify(data)}'` : ''}`
        ])

      const applyDescendant = (html: string): string => {
        const varBegin: string = `<${consts.VAR_TAG_NAME} ${consts.FICS_ID_ATTR}="`,
          varEnd: string = `"></${consts.VAR_TAG_NAME}>`,
          varBeginIndex: number = html.indexOf(varBegin),
          varEndIndex: number = html.indexOf(varEnd)

        if (varBeginIndex < 0 || varEndIndex < 0) return html

        const prev: string = html.slice(0, varBeginIndex),
          next: string = applyDescendant(html.slice(varEndIndex + varEnd.length)),
          instanceId: string = html.slice(varBeginIndex + varBegin.length, varEndIndex)

        if (!(instanceId in that.#childrenStore))
          throw new Error(`The element does not have a valid instanceId in ${that.#name}...`)

        return `${prev}${render(that.#childrenStore[instanceId])}${next}`
      }

      const applyShowAttr = (html: string): string => {
          const showAttrIndex: number = html.indexOf(that.#showAttr)
          if (showAttrIndex < 0) return html

          const openIndex: number = html.indexOf('<', showAttrIndex),
            closeIndex: number = html.indexOf('>', showAttrIndex),
            prev: string = html.slice(0, showAttrIndex)

          let next: string = applyShowAttr(html.slice(showAttrIndex + that.#showAttr.length))

          if (openIndex > 0 && openIndex < closeIndex) return `${prev}${that.#showAttr}${next}`

          const styleAttr: string = 'style="',
            styleIndex: number = prev.lastIndexOf(styleAttr),
            displayKey: string = 'display:',
            displayNone: string = `${displayKey}none`

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
        },
        html: string = applyShowAttr(
          applyDescendant(that.#template.replace(/>\s+</g, '><').replace(/\n\s/g, ''))
        ),
        css = (_css: Css.Sheet<D, P>[]): string =>
          _css.length > 0 ? `<style>${that.#cssToString(_css, true)}</style>` : ''

      return `
        <${joinArray([that.#name, classNameAndAttrs.length ? classNameAndAttrs : ''])}>
          <template shadowrootmode="open"><slot name="${that.#instanceId}"></slot></template>
          <div ${slotAttrs}>${html}${css([...FiCsElement.globalCss, ...that.#css])}</div>
        </${that.#name}>
      `
    }

    if (data) for (const [key, value] of typedEntries(data as D)) this.#data[key] = value

    return render(this, data)
  }

  describe(parent?: HTMLElement): void {
    this.#initProps()
    this.#callback('created')
    this.#enqueue(() => {
      this.#define()
      this.#hasDescribed = true
    }, 'define')
    if (parent) parent.append(document.createElement(this.#name))
  }

  setData<K extends keyof D>(key: K, value: D[K]): void {
    if (!this.#hasDescribed)
      throw new Error(
        `The setData method cannot be called before calling the describe method in ${this.#name}...`
      )

    if (this.#nameKey === 'router' && (key === 'pathname' || key === 'queries'))
      throw new Error(`The "${key as string}" cannot be modified in the router component...`)

    this.#data[key as keyof D] = value as D[keyof D]
  }

  getData<K extends keyof D>(key: K): D[typeof key] {
    if (!this.#hasDescribed)
      throw new Error(
        `The getData method cannot be called before calling the describe method in ${this.#name}...`
      )

    return this.#data[key] as D[typeof key]
  }
}
