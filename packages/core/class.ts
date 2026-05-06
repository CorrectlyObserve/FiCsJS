import consts from './constants'
import runCrud from './crud'
import {
  browserError,
  convertStr,
  deepEqual,
  isBlankString,
  isBrowser,
  isEmptyObject,
  joinArray,
  normalizeRootMargin,
  numberError,
  toArray,
  typedEntries,
  uid
} from './helpers'
import { i18n } from './i18n'
import enqueue from './queue'
import scrollConsts from './scroll/constants'
import { clearTimers, fenwickTree, getScrollAttr } from './scroll/helpers'
import runInfiniteVirtualScroll from './scroll/runtime'
import scrollTemplate from './scroll/template'
import { getQueryCache, syncQueryCache } from './query'
import openEventSource from './sse'
import escape from './template/escape'
import applyShowAttr from './template/forSsr'
import sanitize from './template/sanitize'
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
  Query,
  Scroll,
  SetTimeout,
  SingleOrArray,
  SSE,
  Task,
  Telemetry,
  Void,
  WebSocket as WebSocketNS
} from './types'
import openWebSocket from './websocket'

export default class FiCsElement<D extends object, P extends object> {
  static #generator: Generator<number> = uid()
  static #nameGenerators: Map<string, Generator<number>> = new Map()
  static #activeContext: { instance: Descendant; updater: () => void } | null = null
  static globalCss: Css.Global[] = []
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
    boundFunctions: WeakMap<Function, D[keyof D] | P[keyof P]>
    component?: HTMLElement
  } = { boundFunctions: new WeakMap() }
  readonly #deferredData?: (ctx: DataProps.Payload<D, P, true>) => Promise<Partial<D>>
  readonly #i18nData?: (ctx: DataProps.Payload<D, P> & I18n) => Promise<Partial<D>>
  readonly #propsSources: Props<D, P>[] = []
  readonly #rawProps: P = {} as P
  readonly #props: P = {} as P
  readonly #classNames?: ClassName<D, P>
  readonly #attrs?: Attrs<D, P>
  readonly #html: Html.Core<D, P>
  readonly #css: Css.Sheet<D, P>[] = []
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
  #styleSheet?: CSSStyleSheet
  #lastCssText?: string
  #webSocketProp?: WebSocketNS.Prop
  #scrollObservers?: Scroll.Observers
  #poll?: SetTimeout
  #hasDescribed: boolean = false
  #queryRuntime?: Query.Runtime

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
    if (isBlankString(name)) throw new Error('The FiCsElement name must be a non-empty string...')

    name = convertStr(name, 'kebab')
    if (!/^[a-z\d]+(?:-[a-z\d]+)*$/.test(name))
      throw new Error(
        'The FiCsElement name must contain only lowercase letters, numbers, and single hyphens...'
      )

    this.#nameKey = convertStr(name, 'camel')

    if (!isExceptional && { var: true, router: true, link: true }[name])
      throw new Error(`The "${name}" is a reserved word in FiCsJS...`)

    this.#instanceId = instanceId ?? `${consts.attrs.FICS_ID}${FiCsElement.#generator.next().value}`

    let generator: Generator<number> | undefined = FiCsElement.#nameGenerators.get(name)
    if (!generator) {
      generator = uid()
      FiCsElement.#nameGenerators.set(name, generator)
    }

    const count: number = generator.next().value
    this.#name = `f-${name}${count > 1 ? `${isBrowser() ? '' : '-server'}-${count}` : ''}`

    if (children)
      for (const child of children)
        this.#children[child.#nameKey] =
          convertStr(child.#nameKey, 'kebab') === child.#name.slice(2) ? child.#clone() : child

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
          const dataKey: keyof D = prop as keyof D

          if (deepEqual(this.#rawData[dataKey], value)) return true

          this.#rawData[dataKey] = value

          const subscribers: Set<() => void> | undefined = this.#subscribers.data.get(dataKey)
          if (subscribers) for (const updater of subscribers) updater()

          const updated: Hook.Lifecycle<D, P>['updated'] | undefined = this.#hooks.updated
          if (updated && dataKey in updated) {
            const startedAt: number = Date.now()

            this.#emitMetric({ key: 'updated', detail: this.#createDetail({ dataKey }) })

            try {
              updated[dataKey]!({
                ...this.#getDataProps(true),
                ref: (selector: string) => this.#queryDeeply(selector),
                debounce: this.#debounce.bind(this),
                throttle: this.#throttle.bind(this)
              })
              this.#emitMetric({
                key: 'updated',
                startedAt,
                detail: this.#createDetail({ dataKey, startedAt })
              })
            } catch (error) {
              this.#emitMetric({
                key: 'updated',
                error,
                startedAt,
                detail: this.#createDetail({ dataKey, startedAt })
              })
            }
          }

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

    if (options) {
      const {
        ssr,
        telemetry,
        lazyLoad,
        rootMargin,
        websocket,
        sse,
        scroll,
        query
      }: Options.Ctx<D, P> = options

      if (name === 'router' || ssr === false || lazyLoad) this.#options.ssr = false

      if (telemetry && !isEmptyObject(telemetry)) this.#options.telemetry = telemetry

      if (lazyLoad) this.#options.lazyLoad = true

      if (!isBlankString(rootMargin) && rootMargin !== '0px' && rootMargin !== undefined) {
        if (!lazyLoad)
          throw new Error(
            `The "rootMargin" in options is enabled only if "lazyLoad" is set to true...`
          )

        this.#options.rootMargin = normalizeRootMargin(rootMargin)
      }

      for (const [key, value] of typedEntries({ websocket, sse, scroll } as const)) {
        if (!value || isEmptyObject(value) || !this.#isBrowser) continue

        switch (key) {
          case 'websocket':
            this.#options[key] = { ...value } as WebSocketNS.Options<D, P>
            break

          case 'sse':
            this.#options[key] = { ...value } as SSE.Options<D, P>
            break

          case 'scroll':
            const options = value as (ctx: DataProps.Payload<D, P, true>) => Scroll.Options,
              { unit, itemMinSize, bufferLength, cacheLength }: Scroll.Options = options(
                this.#getDataProps(true)
              ),
              { CACHE_LENGTH }: { CACHE_LENGTH: number } = scrollConsts

            numberError({ unit }, 'positive-int')
            numberError({ itemMinSize }, 'positive')
            numberError({ bufferLength, cacheLength, CACHE_LENGTH }, 'non-negative-int')

            const normalizedLength: number = Math.max(
              Math.floor(Math.max(cacheLength ?? CACHE_LENGTH, unit + (bufferLength ?? 0))),
              1
            )
            this.#options[key] = {
              cache: {
                elementSizes: new Map(),
                indexSizes: new Map(),
                indexKeys: new Map(),
                elementIndexes: new WeakMap(),
                maxLength: normalizedLength,
                startIndex: 0,
                evictedSize: 0,
                evictedCount: 0,
                sizeFenwickTree: fenwickTree.reset(normalizedLength),
                countFenwickTree: fenwickTree.reset(normalizedLength)
              },
              options,
              id: `${this.#instanceId}-scroll`,
              isEnabled: false,
              startIndex: 0,
              endIndex: unit,
              aveSize: itemMinSize,
              totalSize: NaN,
              totalCount: 0,
              prevTotalCount: 0,
              flags: {
                hasScrolled: false,
                isRangeLocked: false,
                isFetchLocked: false,
                shouldRestoreAxisOffset: false
              },
              fetch: { isFetching: false, lastTriggeredCount: 0 },
              firstVisible: {},
              timers: {},
              urlSync: {}
            }
            break
        }
      }

      if (this.#isBrowser && typeof query === 'function') this.#options.query = query
    }

    if (className) this.#classNames = typeof className === 'function' ? className : className.trim()
    if (attributes) this.#attrs = attributes

    this.#html = html

    if (css) this.#css = toArray(css)
    if (clonedCss) this.#css = [...clonedCss]

    if (hooks && !isEmptyObject(hooks) && this.#isBrowser) this.#hooks = { ...hooks }
    if (actions && !isEmptyObject(actions) && this.#isBrowser) this.#actions = { ...actions }
  }

  #clone(instanceId?: string): FiCsElement<D, P> {
    const { scroll, ...args }: Options.Resolved<D, P> = this.#options,
      cloned: FiCsElement<D, P> = new FiCsElement({
        name: this.#nameKey,
        isExceptional: true,
        instanceId: instanceId ?? this.#instanceId,
        data: () => this.#data as Partial<D>,
        children: Object.values(this.#children),
        deferredData: this.#deferredData,
        i18nData: this.#i18nData,
        props: this.#propsSources,
        className: this.#classNames,
        attributes: this.#attrs,
        html: this.#html,
        clonedCss: this.#css,
        actions: this.#actions,
        hooks: this.#hooks,
        options: { ...args, scroll: scroll?.options }
      })

    for (const [key, value] of typedEntries(this.#rawProps)) cloned.#rawProps[key] = value
    return cloned
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

  #emitMetric({ key, error, startedAt, detail }: Telemetry.Ctx<D, P>): void {
    const isError: boolean = error !== undefined,
      type: 'onError' | 'onMetric' = isError ? 'onError' : 'onMetric'

    try {
      this.#options.telemetry?.[type]?.({
        key,
        status: startedAt === undefined ? 'starting' : isError ? 'error' : 'success',
        name: this.#name,
        instanceId: this.#instanceId,
        error,
        detail,
        timestamp: Date.now()
      })
    } catch (callbackError) {
      console.error(`The telemetry ${type} callback failed...`, callbackError)
    } finally {
      if (isError) throw error
    }
  }

  #createDetail({
    key,
    startedAt
  }: {
    key: Task['key']
    startedAt?: number
  }): Telemetry.Detail<D, P>['queue']
  #createDetail({
    key,
    endpoint,
    method,
    isStream,
    startedAt
  }: Omit<Telemetry.Crud, 'durationMs'> & { startedAt?: number }): Telemetry.Crud
  #createDetail({
    key,
    startedAt
  }: {
    key: Exclude<Hook.Key<D, P>, 'updated'>
    startedAt?: number
  }): Telemetry.Detail<D, P>['hook']
  #createDetail({
    dataKey,
    startedAt
  }: {
    dataKey: keyof D
    startedAt?: number
  }): Telemetry.Detail<D, P>['updated']
  #createDetail({
    key,
    endpoint,
    method,
    isStream,
    dataKey,
    startedAt
  }: {
    key?: Task['key'] | Hook.Key<D, P> | string
    endpoint?: string
    method?: string
    isStream?: boolean
    dataKey?: keyof D
    startedAt?: number
  }): Telemetry.Detail<D, P>[keyof Telemetry.Detail<D, P>] {
    const durationMs: number = startedAt === undefined ? 0 : Date.now() - startedAt

    if (endpoint && method && isStream !== undefined)
      return { key, endpoint, method, isStream, durationMs } as Telemetry.Crud

    if (dataKey !== undefined)
      return { key: 'updated', dataKey, durationMs } as Telemetry.Detail<D, P>['updated']

    return { key, durationMs } as Telemetry.Detail<D, P>['queue'] | Telemetry.Detail<D, P>['hook']
  }

  #getDataProps<B extends boolean = false>(hasMethods?: B): DataProps.Payload<D, P, B> {
    return {
      data: this.#data,
      props: this.#props,
      crud: hasMethods ? this.#crud.bind(this) : undefined,
      queryCache: hasMethods ? getQueryCache().api : undefined
    } as DataProps.Payload<D, P, B>
  }

  #enqueue(func: () => Void, key: Task['key']): void {
    enqueue({
      instanceId: this.#instanceId,
      key,
      func: async (): Promise<void> => {
        const startedAt: number = Date.now()
        this.#emitMetric({ key: 'queue', detail: this.#createDetail({ key }) })

        try {
          await func()
          this.#emitMetric({
            key: 'queue',
            startedAt,
            detail: this.#createDetail({ key, startedAt })
          })
        } catch (error) {
          this.#emitMetric({
            key: 'queue',
            error,
            startedAt,
            detail: this.#createDetail({ key, startedAt })
          })
        }
      }
    })
  }

  #crud<T>(endpoint: string, options?: Crud.Options): Promise<T>
  #crud(endpoint: string, options: Crud.StreamOptions): Promise<void>
  async #crud<T>(endpoint: string, options?: Crud.Options | Crud.StreamOptions): Promise<T | void> {
    const startedAt: number = Date.now(),
      key: string = options?.key ?? 'crud',
      method: string = options?.method?.toUpperCase() ?? 'GET',
      isStream: boolean = !!(options && 'onChunk' in options)

    this.#emitMetric({
      key: 'crud',
      detail: this.#createDetail({ key, endpoint, method, isStream })
    })

    try {
      const result: T | void = await runCrud({
        endpoint,
        apiStatuses: this.#apiStatuses,
        enqueue: this.#enqueue.bind(this),
        reRender: this.#reRender.bind(this),
        options
      })

      this.#emitMetric({
        key: 'crud',
        startedAt,
        detail: this.#createDetail({ key, endpoint, method, isStream, startedAt })
      })
      return result
    } catch (error) {
      this.#emitMetric({
        key: 'crud',
        error,
        startedAt,
        detail: this.#createDetail({ key, endpoint, method, isStream, startedAt })
      })
    }
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
            for (const [key, value] of typedEntries(child.#rawProps))
              if (!(key in props)) descendant.#props[key] = value

            for (const [key, value] of typedEntries({ ...props })) descendant.#props[key] = value

            return descendant
          }

        if (clonedSelf) return cloneProps(clonedSelf)

        const cloneRecursively = (child: Descendant, instanceId: string): Descendant => {
          const cloned: Descendant = cloneProps(child.#clone(instanceId))

          for (const [key, _child] of typedEntries(cloned.#children))
            cloned.#children[key] = cloneRecursively(
              _child,
              `${_child.#instanceId}-in-${instanceId}`
            )

          child.#clonedSelves.set(instanceId, cloned)
          if (child.#clonedSelves.size > consts.CLONED_SELVES_LENGTH) {
            const oldestKey: string | undefined = child.#clonedSelves.keys().next().value
            if (oldestKey) child.#clonedSelves.delete(oldestKey)
          }
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
            for (const [key, value] of typedEntries(
              values({
                ...this.#getDataProps(true),
                children: this.#children,
                sendToWebsocket: (value: WebSocketNS.Value) =>
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
      newClassNames: Set<string> = isBlankString(this.#computedClassName)
        ? new Set()
        : new Set(this.#computedClassName.split(/\s+/))

    for (const className of newClassNames)
      if (!component.classList.contains(className)) component.classList.add(className)

    for (const className of oldClassNames)
      if (!newClassNames.has(className)) component.classList.remove(className)

    if (component.classList.length === 0) component.removeAttribute('class')
  }

  get #computedAttrs(): [string, string][] {
    if (!this.#attrs) return []

    const attrs: [string, string][] = []
    for (const [key, value] of typedEntries(
      typeof this.#attrs === 'function' ? this.#attrs(this.#getDataProps()) : this.#attrs
    ))
      attrs.push([key.trim(), value.trim()])

    return attrs
  }

  #isBooleanAttr(attr: string): boolean {
    return consts.BOOLEAN_ATTRS.has(attr.trim().toLowerCase())
  }

  #isBooleanAttrEnabled(attr: string, value: string): boolean {
    attr = attr.trim().toLowerCase()
    if (!this.#isBooleanAttr(attr)) return false

    const normalized: string = value.trim().toLowerCase()
    return isBlankString(normalized) || normalized === 'true' || normalized === attr
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
      if (this.#isBooleanAttr(key)) {
        const prop: string = convertStr(key, 'camel'),
          isEnabled: boolean = this.#isBooleanAttrEnabled(key, value),
          wasEnabled: boolean =
            prop in component
              ? !!Reflect.get(component, prop)
              : this.#isBooleanAttrEnabled(key, oldAttrs[key] ?? '')

        if (wasEnabled !== isEnabled) {
          if (prop in component) Reflect.set(component, prop, isEnabled)
          isEnabled ? component.setAttribute(key, '') : component.removeAttribute(key)
        }
      } else if (oldAttrs[key] !== value) component.setAttribute(key, value)

      newAttrNames.add(key)
    }

    for (const key in oldAttrs)
      if (key !== 'class' && !newAttrNames.has(key)) {
        if (this.#isBooleanAttr(key)) {
          const prop: string = convertStr(key, 'camel')
          if (prop in component) Reflect.set(component, prop, false)
        }

        component.removeAttribute(key)
      }
  }

  #getChildNodes(parent: DocumentFragment | ChildNode): ChildNode[] {
    return Array.from(parent.childNodes)
  }

  get #template(): string {
    this.#addSetIndividualProps()

    const {
        a11y: { STATUS_LIVE_REGION },
        attrs: { FICS_ID, SHOW },
        symbols: { SANITIZED, UNSAFE_HTML },
        VAR_TAG_NAME
      } = consts,
      template: Html.Template<D, P> = (
        strings: TemplateStringsArray,
        ...variables: (Html.Content<D, P> | unknown)[]
      ): Html.Sanitized<D, P> => ({
        [SANITIZED]: sanitize<Exclude<Html.Content<D, P>, string>>({
          strings,
          variables,
          name: this.#name,
          isFiCsElement: (variable: unknown): variable is Exclude<Html.Content<D, P>, string> =>
            variable instanceof FiCsElement
        }) as Html.Content<D, P>[]
      })

    const contents: Html.Content<D, P>[] = this.#html({
      ...this.#getDataProps(),
      children: this.#children,
      crud: this.#crud.bind(this),
      template: (
        strings: TemplateStringsArray,
        ...variables: (Html.Content<D, P> | unknown)[]
      ): Html.Sanitized<D, P> => template(strings, ...variables),
      unsafeHtml: (str: string): Record<symbol, string> => ({ [UNSAFE_HTML]: str }),
      show: (condition: boolean): string => (condition ? '' : SHOW),
      apiStatuses: Object.fromEntries(this.#apiStatuses),
      attributes: {
        boolean: (condition: boolean | undefined): 'true' | 'false' =>
          condition ? 'true' : 'false',
        statusLiveRegion: STATUS_LIVE_REGION
      },
      isBrowser: this.#isBrowser,
      isDeferred: this.#isDeferred,
      scroll: <T>(
        array: ReadonlyArray<T> | null | undefined,
        callback: (item: T, index: number) => Html.Sanitized<D, P>
      ): Html.Sanitized<D, P> =>
        scrollTemplate({
          instanceId: this.#instanceId,
          getDataProps: this.#getDataProps.bind(this),
          template,
          scrollOptions: this.#options.scroll,
          array,
          callback
        })
    })[SANITIZED]

    return contents.reduce((prev, curr) => {
      if (curr instanceof FiCsElement) {
        const instanceId: string = curr.#instanceId

        if (!(instanceId in this.#childrenStore)) this.#childrenStore[instanceId] = curr
        curr = `<${VAR_TAG_NAME} ${FICS_ID}="${instanceId}"></${VAR_TAG_NAME}>`
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
        isHTMLElement(childNode) && childNode.localName === 'textarea',
      {
        attrs: { FICS_ID, SHOW },
        VAR_TAG_NAME
      } = consts

    const convertChildNodes = (childNodes: ChildNode[]): void => {
      for (let index = 0; index < childNodes.length; index++) {
        const childNode: ChildNode = childNodes[index],
          parentNode: ParentNode | null = childNode.parentNode

        if (
          isText(childNode) &&
          isBlankString(childNode?.nodeValue) &&
          (!parentNode || !isTextarea(parentNode))
        ) {
          childNode.parentNode?.removeChild(childNode)
          childNodes.splice(index, 1)
          index--
          continue
        }

        if (isElement(childNode)) {
          if (childNode.localName === VAR_TAG_NAME) {
            const instanceId: string | null = childNode.getAttribute(FICS_ID)

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

          if (childNode.hasAttribute(SHOW)) {
            ;(childNode as HTMLElement).style.display = 'none'
            childNode.removeAttribute(SHOW)
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

          const isOldChildNodeHTMLElement: boolean = isHTMLElement(oldChildNode)
          for (let i = 0; i < newAttrs.length; i++) {
            const { name, value, namespaceURI }: Html.PickedAttr = newAttrs[i],
              oldAttr: Omit<Html.PickedAttr, 'name'> | undefined = oldAttrList[name],
              isDiffAttr: boolean = oldAttr?.value !== value

            if (isOldChildNodeHTMLElement) {
              const isBoolean: boolean = that.#isBooleanAttr(name),
                prop: string = convertStr(name, 'camel'),
                hasProp: boolean = prop in oldChildNode,
                isEnabled: boolean = that.#isBooleanAttrEnabled(name, value)

              let wasEnabled: boolean = false
              if (isBoolean)
                wasEnabled = hasProp
                  ? !!Reflect.get(oldChildNode, prop)
                  : that.#isBooleanAttrEnabled(name, oldAttr?.value ?? '')

              if (wasEnabled !== isEnabled || isDiffAttr) {
                if (name !== FICS_ID && hasProp)
                  Reflect.set(oldChildNode, prop, isBoolean ? isEnabled : value)

                if (!isBoolean) oldChildNode.setAttribute(name, value)
                else if (isEnabled) oldChildNode.setAttribute(name, '')
                else oldChildNode.removeAttribute(name)
              }
            } else if (isDiffAttr)
              namespaceURI
                ? oldChildNode.setAttributeNS(namespaceURI, name, value)
                : oldChildNode.setAttribute(name, value)

            delete oldAttrList[name]
          }

          for (const name in oldAttrList)
            if (isOldChildNodeHTMLElement) {
              if (that.#isBooleanAttr(name)) {
                const prop: string = convertStr(name, 'camel')
                if (prop in oldChildNode) Reflect.set(oldChildNode, prop, false)
              }

              oldChildNode.removeAttribute(name)
            } else {
              const { namespaceURI, localName }: Omit<Html.PickedAttr, 'name'> = oldAttrList[name]

              if (namespaceURI) oldChildNode.removeAttributeNS(namespaceURI, localName)
              else oldChildNode.removeAttribute(name)
            }

          if (isTextarea(oldChildNode) && isTextarea(newChildNode)) {
            oldChildNode.value = newChildNode.value
            return
          }

          if (!!Reflect.get(oldChildNode, convertStr(FICS_ID, 'camel'))) return

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
        const scrollAttr: string = getScrollAttr({
          instanceId: that.#instanceId,
          type: 'wrap',
          hasValue: false
        })

        /**
         * @remarks
         * DOM identity is intentionally reset here to prioritize virtual-scroll rendering performance.
         */
        if (parentNode instanceof Element && parentNode.getAttribute(scrollAttr) === 'true') {
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
            before && before.parentNode !== parentNode ? null : before
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
              try {
                const { length }: { length: number } = childNode.value
                childNode.setSelectionRange(length, length)
              } catch {
                const { localName, type }: { localName: string; type: string } = childNode
                console.warn(
                  `The setSelectionRange is not supported on <${localName} type="${childNode instanceof HTMLInputElement ? type : 'textarea'}">...`
                )
              }
            }
          }
        }

        const getMapKey = (childNode: ChildNode): string => {
            const { nodeName }: { nodeName: string } = childNode,
              key: string | null = isElement(childNode) ? getKey(childNode) : null

            return key ? `${nodeName}-${key}` : nodeName
          },
          _getKey = (element: Element): string | number | null => {
            const key: string | number | null = getKey(element),
              numKey: number = parseInt(key ?? '', 10)

            return Number.isFinite(numKey) ? numKey : key
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
                  !!Reflect.get(oldChildNode, convertStr(FICS_ID, 'camel'))
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
              const key: string | number | null = _getKey(newStartNode)

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
          keyChildNodes.get(getMapKey(childNode)) ? focusNode(childNode) : childNode.remove()
        }
      }

      updateChildNodes(shadowRoot, oldChildNodes, newChildNodes)
    }
  }

  #cssToString(css: Css.Sheet<D, P>[], isSsr?: boolean): string {
    if (css.length === 0) return ''

    const normalizeProperty = (key: string | number): string => {
        if (typeof key === 'number') return key.toString()
        /** @remarks CSS custom properties */
        if (key.startsWith('--')) return key

        key = convertStr(key, 'kebab')
        if (key.startsWith('webkit')) key = `-${key}`
        return key
      },
      normalizeHost = (selector: string | number): string => {
        if (!isSsr || typeof selector === 'number') return selector.toString()

        const ssrHost: string = `div#${this.#name}`
        return selector
          .replace(new RegExp(`${consts.hostSelector.GROUP}`, 'g'), `${ssrHost}$1`)
          .replace(new RegExp(`${consts.hostSelector.STRICT}`, 'g'), ssrHost)
      },
      convertCss = (style: Css.Value<D, P> | Css.Declarations, topLevelCss: string[]): string =>
        typedEntries(typeof style === 'function' ? style(this.#getDataProps()) : style).reduce(
          (prev, [key, value]) => {
            if (typeof key === 'number') numberError({ key }, 'finite')

            if (value === undefined || isBlankString(value) || isEmptyObject(value)) return prev

            if (typeof key === 'string' && key.startsWith('@keyframes')) {
              topLevelCss.push(`${key}{${convertCss(value as Css.Value<D, P>, topLevelCss)}}`)
              return prev
            }

            if (typeof value === 'string' || typeof value === 'number')
              return `${prev}${normalizeProperty(key)}:${value};`

            return `${prev}${normalizeHost(key)}{${convertCss(value as Css.Declarations, topLevelCss)}}`
          },
          ''
        )

    return css.reduce((prev, curr) => {
      if (typeof curr === 'string') return `${prev}${normalizeHost(curr)}`

      const topLevelCss: string[] = [],
        joinCss = (cssTexts: string[]): string =>
          joinArray([prev, ...cssTexts, ...topLevelCss], false)

      if (typeof curr === 'function')
        return joinCss([
          normalizeHost(
            curr({
              ...this.#getDataProps(),
              cssToString: (declarations: Css.Declarations) => convertCss(declarations, topLevelCss)
            })
          )
        ])

      return joinCss(
        typedEntries(curr).map(
          ([selector, style]) => `${normalizeHost(selector)}{${convertCss(style, topLevelCss)}}`
        )
      )
    }, '') as string
  }

  #buildCss(shadowRoot: ShadowRoot): void {
    const css: Css.Sheet<D, P>[] = [...FiCsElement.globalCss, ...this.#css]
    if (css.length === 0) return

    if (!this.#styleSheet) this.#styleSheet = new CSSStyleSheet()

    const cssText: string = this.#cssToString([
      `${consts.hostSelector.ITSELF}{display:block}`,
      ...css
    ])

    if (this.#lastCssText !== cssText) {
      this.#styleSheet.replaceSync(cssText)
      this.#lastCssText = cssText
    }
    shadowRoot.adoptedStyleSheets = [this.#styleSheet]
  }

  #getShadowRoot(component: HTMLElement): ShadowRoot {
    if (component.shadowRoot) return component.shadowRoot

    throw new Error(`${this.#name} does not have shadowRoot...`)
  }

  #getElements(component: HTMLElement, selector: string): Element[] {
    let trimmedSelector: string = selector.trim()
    const {
      hostSelector: { ITSELF }
    } = consts

    if (trimmedSelector === ITSELF) return [component]

    const isDirectChild: boolean = trimmedSelector.startsWith(`${ITSELF} >`)
    if (isDirectChild || trimmedSelector.startsWith(`${ITSELF} `)) {
      const sliced: string = trimmedSelector.slice(ITSELF.length)
      trimmedSelector = isDirectChild ? `:scope ${sliced}` : sliced.trimStart()
    }

    const shadowRoot: ShadowRoot = this.#getShadowRoot(component)
    try {
      return Array.from(shadowRoot.querySelectorAll(trimmedSelector))
    } catch (error) {
      throw new Error(`The selector "${selector}" in ${this.#name} is invalid...`)
    }
  }

  #queryDeeply<T extends Element = Element>(selector: string, shadowRoot?: ShadowRoot): T | null {
    if (!shadowRoot && !this.#cache.component) return null

    const searchedShadowRoots: Set<ShadowRoot> = new Set<ShadowRoot>(),
      searchShadowRootRecursively = (shadowRoot: ShadowRoot): T | null => {
        if (searchedShadowRoots.has(shadowRoot)) return null
        searchedShadowRoots.add(shadowRoot)

        try {
          const searched: T | null = shadowRoot.querySelector(selector)
          if (searched) return searched
        } catch {
          throw new Error(`The selector "${selector}" in ${this.#name} is invalid...`)
        }

        const treeWalker: TreeWalker = shadowRoot.ownerDocument.createTreeWalker(
          shadowRoot,
          NodeFilter.SHOW_ELEMENT
        )
        let element: Element | null = treeWalker.nextNode() as Element | null

        while (element) {
          const nestedShadowRoot: ShadowRoot | null =
            (element as { shadowRoot?: ShadowRoot | null }).shadowRoot ?? null

          if (nestedShadowRoot) {
            const foundShadowRoot: T | null = searchShadowRootRecursively(nestedShadowRoot)
            if (foundShadowRoot) return foundShadowRoot
          }

          element = treeWalker.nextNode() as Element | null
        }

        return null
      }

    return searchShadowRootRecursively(shadowRoot ?? this.#getShadowRoot(this.#cache.component!))
  }

  #debounce<T extends (...args: Parameters<T>) => void>(
    func: T,
    ms: number
  ): (...args: Parameters<T>) => void {
    numberError({ ms }, 'non-negative-int')

    let timeout: SetTimeout | undefined

    return (...args: Parameters<T>): void => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), ms)
    }
  }

  #throttle<T extends (...args: Parameters<T>) => void>(
    func: T,
    ms: number
  ): (...args: Parameters<T>) => void {
    numberError({ ms }, 'non-negative-int')

    let lastTime: number = 0

    return (...args: Parameters<T>): void => {
      const now: number = Date.now()

      if (now - lastTime >= ms) {
        lastTime = now
        func(...args)
      }
    }
  }

  #addEventListener({ element, shadowRoot, entries }: Action.Ctx<D, P>) {
    const addEventListener = (
      handler: string,
      method: Action.Method<D, P>,
      options?: Action.Options
    ): void => {
      if (handler !== 'click' && options?.blur)
        throw new Error('The "blur" is enabled only if the handler is click...')

      const { debounceMs, throttleMs, blur, once }: Action.Options = options ?? {}
      if (debounceMs && throttleMs)
        throw new Error('Both "debounce" and "throttle" options cannot be used at the same time...')

      const callback = (event: Event): void => {
        const attrs: Record<string, string> = {}

        for (let index = 0; index < element.attributes.length; index++) {
          const { name, value }: { name: string; value: string } = element.attributes[index]
          attrs[name] = value
        }

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
        debounceMs
          ? this.#debounce(callback, debounceMs)
          : throttleMs
            ? this.#throttle(callback, throttleMs)
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
    runInfiniteVirtualScroll({
      name: this.#name,
      instanceId: this.#instanceId,
      shadowRoot,
      getDataProps: this.#getDataProps.bind(this),
      scrollOptions: this.#options.scroll,
      addEventListener: this.#addEventListener.bind(this),
      reRender: () => this.#enqueue(() => this.#reRender(), 're-render'),
      scrollObservers: this.#scrollObservers,
      setScrollObservers: (observers?: Scroll.Observers): void => {
        this.#scrollObservers = observers
      }
    })
  }

  #callback(key: Exclude<Hook.Key<D, P>, 'updated'>, shadowRoot?: ShadowRoot): void {
    if (this.#hooks?.[key] === undefined) return

    const ctx: Hook.Ctx<D, P> = {
        ...this.#getDataProps(true),
        ref: (selector: string) => this.#queryDeeply(selector, shadowRoot),
        debounce: this.#debounce.bind(this),
        throttle: this.#throttle.bind(this)
      },
      executeHook = (callback: () => void): void => {
        const startedAt: number = Date.now()
        this.#emitMetric({ key: 'hook', detail: this.#createDetail({ key }) })

        try {
          callback()
          this.#emitMetric({
            key: 'hook',
            startedAt,
            detail: this.#createDetail({ key, startedAt })
          })
        } catch (error) {
          this.#emitMetric({
            key: 'hook',
            error,
            startedAt,
            detail: this.#createDetail({ key, startedAt })
          })
        }
      }

    if (key === 'mounted') {
      const that: FiCsElement<D, P> = this,
        poll = (
          func: ({ times }: { times: number }) => void,
          { intervalMs, maxRetries, exit }: Hook.Polling
        ): void => {
          numberError({ intervalMs, maxRetries }, 'non-negative-int')

          let times: number = 0
          const execute: SetTimeout = setTimeout(function run() {
            if ((maxRetries && times >= maxRetries) || (exit && exit())) {
              clearTimeout(execute)
              return
            }

            func({ times })
            times++
            that.#poll = setTimeout(run, intervalMs)
          }, intervalMs)

          that.#poll = execute
        }

      executeHook(() => this.#hooks[key]!({ ...ctx, poll }))
    } else executeHook(() => this.#hooks[key]!(ctx))
  }

  #define(): void {
    browserError()

    const that: FiCsElement<D, P> = this,
      { lazyLoad, rootMargin }: Options.Resolved<D, P> = that.#options

    window.customElements.define(
      that.#name,
      class extends HTMLElement {
        readonly #shadowRoot: ShadowRoot
        #isRendered: boolean = false
        #websocket?: WebSocketNS.Runtime
        #eventSource?: EventSource
        #removeEventListeners?: () => void

        constructor() {
          super()
          this.#shadowRoot = this.attachShadow({ mode: 'open' })
        }

        #activateRuntime(): void {
          that.#infiniteVirtualScroll(this.#shadowRoot)
          this.#deactivateRuntime()

          this.#websocket = openWebSocket({
            options: that.#options.websocket,
            getDataProps: that.#getDataProps.bind(that),
            setWebSocketProp: (prop: WebSocketNS.Prop | undefined) => (that.#webSocketProp = prop)
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

          this.#eventSource = eventSource
          this.#removeEventListeners = removeEventListeners

          that.#queryRuntime = syncQueryCache({
            queryCache: getQueryCache(),
            getDataProps: that.#getDataProps.bind(that),
            options: that.#options.query
          })
        }

        #deactivateRuntime(): void {
          this.#websocket?.close()
          this.#websocket = undefined

          this.#eventSource?.close()
          this.#eventSource = undefined

          this.#removeEventListeners?.()
          this.#removeEventListeners = undefined

          that.#queryRuntime?.destroy()
          that.#queryRuntime = undefined
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
                for (const [key, value] of typedEntries(
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
          that.#buildCss(this.#shadowRoot)

          for (const [selector, action] of typedEntries(that.#actions))
            for (const element of that.#getElements(this, selector))
              that.#addEventListener({
                element,
                shadowRoot: this.#shadowRoot,
                entries: typedEntries(action)
              })

          that.#removeChildNodes(this)
          Reflect.set(this, convertStr(consts.attrs.FICS_ID, 'camel'), that.#instanceId)

          that.#cache.component = this
          this.#activateRuntime()
        }

        async connectedCallback(): Promise<void> {
          if (this.#isRendered) this.#activateRuntime()
          else {
            const mount = (): void => {
              this.#init()
              that.#callback('mounted', this.#shadowRoot)
              this.#isRendered = true
            }

            if (lazyLoad) {
              const observer: IntersectionObserver = new IntersectionObserver(
                async ([{ isIntersecting, target }]) => {
                  if (isIntersecting) {
                    mount()
                    observer.unobserve(target)
                  }
                },
                { rootMargin }
              )

              setTimeout(() => observer.observe(this))
            } else mount()
          }
        }

        disconnectedCallback(): void {
          if (that.#poll) {
            clearTimeout(that.#poll)
            that.#poll = undefined
          }

          this.#deactivateRuntime()

          if (that.#scrollObservers) {
            for (const observer of ['intersection', 'mutation', 'resize'] as const)
              that.#scrollObservers[observer].disconnect()

            that.#scrollObservers = undefined
          }

          if (that.#options.scroll) {
            clearTimers(that.#options.scroll)
            that.#options.scroll.isEnabled = false
          }

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
        for (const [key, value] of typedEntries(
          await this.#i18nData({
            ...this.#getDataProps(),
            i18n: async <T>({ lang, key }: { lang: string; key: SingleOrArray<string> }) =>
              i18n<T>({ lang, key })
          })
        )) {
          const _key: keyof D = key as keyof D
          if (!deepEqual(this.#data[_key], value)) this.#data[_key] = value as D[keyof D]
        }

      this.#queryRuntime?.sync()

      if (!isOnlyHtml) {
        this.#setClassNames(component)
        this.#setAttrs(component)
      }

      const shadowRoot: ShadowRoot = this.#getShadowRoot(component)

      this.#buildHtml(shadowRoot)
      this.#infiniteVirtualScroll(shadowRoot)

      if (!isOnlyHtml) this.#buildCss(shadowRoot)

      const addAllElements = (elements: Element[] | Set<Element>): void => {
        for (const element of elements) {
          if (element instanceof Element && !this.#newElements.has(element))
            this.#newElements.add(element)

          addAllElements(this.#getChildNodes(element) as Element[])
        }
      }

      addAllElements(this.#newElements)

      for (const [selector, action] of typedEntries(this.#actions))
        for (const element of this.#getElements(component, selector))
          if (this.#newElements.has(element))
            this.#addEventListener({ element, shadowRoot, entries: typedEntries(action) })

      this.#newElements.clear()
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
    if (this.#isBrowser)
      throw new Error(
        `The "toString" method can only be called in the server environment in ${this.#name}...`
      )

    const render = (that: FiCsElement<D, P>, data?: Partial<D>): string => {
      that.#initProps()

      if (!that.#options.ssr) return `<${that.#name}></${that.#name}>`

      const attrs: string[] = []
      if (that.#classNames && !isBlankString(that.#computedClassName))
        attrs.push(`class="${escape(that.#computedClassName)}"`)

      if (that.#computedAttrs.length > 0)
        for (const [key, value] of that.#computedAttrs)
          if (that.#isBooleanAttrEnabled(key, value)) attrs.push(escape(key))
          else if (!that.#isBooleanAttr(key)) attrs.push(`${escape(key)}="${escape(value)}"`)

      const slotAttrs: string = joinArray([
          `id="${that.#name}"`,
          `slot="${that.#instanceId}"`,
          `${data ? `data-${that.#name}="${escape(JSON.stringify(data))}"` : ''}`
        ]),
        html: string = applyShowAttr({
          html: that.#template.replace(/>\s+</g, '><').replace(/\n\s/g, ''),
          resolveInstanceId: (instanceId: string): string => {
            if (isBlankString(instanceId) || !(instanceId in that.#childrenStore))
              throw new Error(`The element does not have a valid instanceId in ${that.#name}...`)

            return render(that.#childrenStore[instanceId])
          }
        }),
        css = (_css: Css.Sheet<D, P>[]): string =>
          _css.length > 0 ? `<style>${that.#cssToString(_css, true)}</style>` : ''

      return `
        <${joinArray([that.#name, ...(attrs.length > 0 ? attrs : [])])}>
          <template shadowrootmode="open"><slot name="${that.#instanceId}"></slot></template>
          <div ${slotAttrs}>${html}${css([...FiCsElement.globalCss, ...that.#css])}</div>
        </${that.#name}>
      `
    }

    if (data) for (const [key, value] of typedEntries(data as D)) this.#rawData[key] = value
    return render(this, data)
  }

  describe(parent?: HTMLElement): void {
    this.#initProps()
    this.#hasDescribed = true
    this.#callback('created')
    this.#enqueue(this.#define.bind(this), 'define')
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
