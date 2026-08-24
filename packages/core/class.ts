import {
  a11y,
  attrs,
  BOOLEAN_ATTRS,
  CLONED_SELVES_LENGTH,
  hostSelector as h,
  symbols,
  VAR_TAG_NAME
} from './constants'
import { crud } from './crud'
import { defineFormSurface, formInternals, submitForm, syncForm, touchedControls } from './form'
import {
  browserError,
  convertStr,
  deepEqual,
  escape,
  isBlankString,
  isBrowser,
  isEmptyObject,
  isObject,
  NOOP,
  normalizeRootMargin,
  numberError,
  toArray,
  typedEntries,
  uid
} from './helpers'
import { i18n } from './i18n'
import { optimisticUpdate } from './optimisticUpdate'
import { enqueue } from './queue'
import { CACHE_LENGTH } from './scroll/constants'
import { clearTimers, fenwickTree, getScrollAttr } from './scroll/helpers'
import { runInfiniteVirtualScroll } from './scroll/runtime'
import { scrollTemplate } from './scroll/template'
import { createQueryCache, getQueryCache, lockQueryCache, type QueryCache } from './query'
import { openEventSource } from './sse'
import { applyShowAttr } from './template/forSsr'
import { sanitize } from './template/sanitize'
import type {
  Action,
  Attrs,
  Awaitable,
  Children,
  ClassName,
  Crud,
  Css,
  DataProps,
  Descendant,
  FiCs,
  Form,
  Html,
  Hook,
  I18n,
  Optimistic,
  Options,
  Props,
  Scroll,
  SetTimeout,
  SSE,
  Task,
  Telemetry,
  WebSocket as WebSocketNS
} from './types'
import { openWebSocket } from './websocket'

export class FiCsElement<D extends object, P extends object> {
  static #generator: Generator<number> = uid()
  static #nameGenerators: Map<string, Generator<number>> = new Map()
  static #activeEffect: { instance: Descendant; run: () => void } | null = null
  static globalCss: Css.Global[] = []
  readonly #nameKey: string
  readonly #instanceId: string
  readonly #name: string
  readonly #children: Children
  readonly #isBrowser: boolean
  readonly #rawData: D = {} as D
  readonly #data: D = {} as D
  readonly #immutableDataKeys: Set<keyof D> = new Set()
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
  readonly #isFormAssociated: boolean = false
  readonly #clonedSelves: Map<string, Descendant> = new Map()
  readonly #activeApis: Map<string, boolean> = new Map()
  readonly #optimisticUpdateFn: ReturnType<typeof optimisticUpdate>
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
  #abortController: AbortController = new AbortController()
  #ssrQueryCache: QueryCache | null = null
  #hasDescribed: boolean = false

  constructor({
    name,
    instanceId,
    children,
    data,
    immutableDataKeys,
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
    this.#nameKey = name
    this.#instanceId = instanceId ?? `${attrs.FICS_ID}${FiCsElement.#generator.next().value}`

    let generator: Generator<number> | undefined = FiCsElement.#nameGenerators.get(this.#nameKey)
    if (!generator) {
      generator = uid()
      FiCsElement.#nameGenerators.set(this.#nameKey, generator)
    }

    const count: number = generator.next().value
    this.#name = `f-${this.#nameKey}${count > 1 ? `${isBrowser() ? '' : '-server'}-${count}` : ''}`

    this.#children = new Proxy({} as Children, {
      get: (target: Children, key: string | symbol): unknown => {
        if (typeof key === 'string' && !(key in target))
          throw new Error(`The child component "${key}" is not registered in ${this.#name}...`)

        return Reflect.get(target, key)
      }
    })

    if (children)
      for (const child of children)
        this.#children[convertStr(child.#nameKey.replace(/^_/, ''), 'camel')] =
          child.#nameKey === child.#name.slice(2) ? child.#clone() : child

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
          if (FiCsElement.#activeEffect) {
            const key: keyof D = prop as keyof D

            if (!this.#subscribers.data.has(key)) this.#subscribers.data.set(key, new Set())
            this.#subscribers.data.get(key)!.add(FiCsElement.#activeEffect.run)
          }

          return this.#bindFunction(Reflect.get(target, prop, receiver)) as D[keyof D]
        },
        set: (_, prop, value): boolean => {
          const dataKey: keyof D = prop as keyof D

          if (deepEqual(this.#rawData[dataKey], value)) return true

          this.#rawData[dataKey] = value

          const subscribers: Set<() => void> | undefined = this.#subscribers.data.get(dataKey)
          if (subscribers) for (const run of subscribers) run()

          const KEY = 'updated' as const,
            updated: Hook.Lifecycle<D, P>[typeof KEY] | undefined = this.#hooks.updated

          if (updated && dataKey in updated) {
            const startedAt: number = Date.now()
            this.#emitMetric({ key: KEY, details: { dataKey } })

            try {
              updated[dataKey]!({
                ...this.#getDataProps(true),
                ref: (selector: string) => this.#queryDeeply(selector),
                debounce: this.#debounce.bind(this),
                throttle: this.#throttle.bind(this),
                signal: this.#abortController.signal,
                form: this.#formAssociation
              })
              this.#emitMetric({ key: KEY, startedAt, details: { dataKey } })
            } catch (error) {
              this.#emitMetric({ key: KEY, error, startedAt, details: { dataKey } })
              if (!this.#options.telemetry?.onError)
                console.error(
                  `The updated hook of "${String(dataKey)}" failed in the ${this.#name}...`,
                  error
                )
            }
          }

          if (!this.#isInRerendering && this.#isBrowser && this.#cache.component)
            this.#enqueue(this.#reRender.bind(this), 're-render')

          return true
        }
      })

      this.#immutableDataKeys = new Set(immutableDataKeys)
    }

    if (props) {
      const propsArray: Props<D, P>[] = toArray(props)
      if (propsArray.length > 0) this.#propsSources = propsArray
    }

    this.#props = new Proxy(this.#rawProps, {
      get: (target, prop, receiver): P[keyof P] => {
        if (FiCsElement.#activeEffect) {
          const key: keyof P = prop as keyof P

          if (!this.#subscribers.props.has(key)) this.#subscribers.props.set(key, new Set())
          this.#subscribers.props.get(key)!.add(FiCsElement.#activeEffect.run)
        }

        return this.#bindFunction(Reflect.get(target, prop, receiver)) as P[keyof P]
      },
      set: (_, prop, value): true => {
        const key: keyof P = prop as keyof P

        if (deepEqual(this.#rawProps[key], value)) return true

        this.#rawProps[key] = value

        const subscribers: Set<() => void> | undefined = this.#subscribers.props.get(key)
        if (subscribers) for (const run of subscribers) run()

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
        form,
        scroll
      }: Options.Ctx<D, P> = options

      if (ssr === false || lazyLoad) this.#options.ssr = false

      if (telemetry && !isEmptyObject(telemetry)) this.#options.telemetry = telemetry

      if (lazyLoad) this.#options.lazyLoad = true

      if (!isBlankString(rootMargin) && rootMargin !== '0px' && rootMargin !== undefined) {
        if (!lazyLoad)
          throw new Error(
            `The "rootMargin" in options is enabled only if "lazyLoad" is set to true...`
          )

        this.#options.rootMargin = normalizeRootMargin(rootMargin)
      }

      if (form && !isEmptyObject(form)) this.#isFormAssociated = true

      for (const [key, value] of typedEntries({ websocket, sse, scroll, form } as const)) {
        if (!value || isEmptyObject(value) || !this.#isBrowser) continue

        switch (key) {
          case 'websocket':
            this.#options[key] = { ...value } as WebSocketNS.Options<D, P>
            break

          case 'sse':
            this.#options[key] = { ...value } as SSE.Options<D, P>
            break

          case 'form':
            this.#options[key] = { ...value } as Form.Options<D, P>
            break

          case 'scroll':
            const options = value as (ctx: DataProps.Payload<D, P, true>) => Scroll.Options,
              { unit, itemMinSize, bufferLength, cacheLength }: Scroll.Options = options(
                this.#getDataProps(true)
              )

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
    }

    if (className) this.#classNames = typeof className === 'function' ? className : className.trim()
    if (attributes) this.#attrs = attributes

    this.#html = html

    if (css) this.#css = toArray(css)
    if (clonedCss) this.#css = [...clonedCss]

    if (hooks && !isEmptyObject(hooks) && this.#isBrowser) this.#hooks = { ...hooks }
    if (actions && !isEmptyObject(actions) && this.#isBrowser) this.#actions = { ...actions }

    this.#optimisticUpdateFn = optimisticUpdate()
  }

  #clone(instanceId?: string): FiCsElement<D, P> {
    const { scroll, ...args }: Options.Resolved<D, P> = this.#options,
      cloned: FiCsElement<D, P> = new FiCsElement({
        name: this.#nameKey,
        instanceId: instanceId ?? this.#instanceId,
        data: () => this.#data as Partial<D>,
        immutableDataKeys: [...this.#immutableDataKeys],
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

  #emitMetric({ key, error, startedAt, details }: Telemetry.Ctx<D, P>): void {
    const isError: boolean = error !== undefined,
      type: 'onError' | 'onMetric' = isError ? 'onError' : 'onMetric',
      hasNotStarted = startedAt === undefined

    try {
      const timestamp: number = Date.now()
      this.#options.telemetry?.[type]?.({
        key,
        name: this.#name,
        instanceId: this.#instanceId,
        status: hasNotStarted ? 'starting' : isError ? 'error' : 'success',
        error,
        details: { ...(details ?? {}), durationMs: hasNotStarted ? 0 : timestamp - startedAt },
        timestamp
      })
    } catch (callbackError) {
      console.error(`The telemetry ${type} callback failed...`, callbackError)
    }
  }

  get #queryCache(): QueryCache {
    if (this.#ssrQueryCache) return this.#ssrQueryCache

    if (!this.#isBrowser)
      throw new Error(`Please pass a queryCache via toString({ queryCache }) in ${this.#name}...`)

    return getQueryCache()
  }

  #getDataProps(): DataProps.Payload<D, P, false>
  #getDataProps(hasMethods: true): DataProps.Payload<D, P, true>
  #getDataProps(hasMethods?: boolean): DataProps.Payload<D, P, boolean> {
    return {
      data: this.#data,
      props: this.#props,
      crud: hasMethods ? this.#crud.bind(this) : undefined,
      queryCache: hasMethods ? this.#queryCache.api : undefined,
      optimisticUpdate: hasMethods ? this.#optimisticUpdate.bind(this) : undefined
    } as DataProps.Payload<D, P, boolean>
  }

  #enqueue(func: () => Awaitable, key: Task['key']): void {
    enqueue({
      instanceId: this.#instanceId,
      key,
      func: async (): Promise<void> => {
        const startedAt: number = Date.now()
        this.#emitMetric({ key })

        try {
          await func()
          this.#emitMetric({ key, startedAt })
        } catch (error) {
          this.#emitMetric({ key, error, startedAt })
          if (!this.#options.telemetry?.onError) throw error
        }
      }
    })
  }

  #crud<T>(endpoint: string, options?: Crud.Options): Promise<T>
  #crud(endpoint: string, options: Crud.StreamOptions): Promise<void>
  async #crud<T>(endpoint: string, options?: Crud.Options | Crud.StreamOptions): Promise<T | void> {
    const startedAt: number = Date.now(),
      details: Telemetry.Details<D, P>['crud'] = {
        key: options?.key ?? '',
        endpoint,
        method: options?.method?.toUpperCase() ?? 'GET',
        isStream: !!(options && 'onChunk' in options)
      }

    this.#emitMetric({ key: 'crud', details })

    try {
      const result: T | void = await crud({
        endpoint,
        name: this.#name,
        activeApis: this.#activeApis,
        enqueue: this.#enqueue.bind(this),
        reRender: this.#reRender.bind(this),
        options
      })

      this.#emitMetric({ key: 'crud', startedAt, details })
      return result
    } catch (error) {
      this.#emitMetric({ key: 'crud', error, startedAt, details })
      throw error
    }
  }

  async #optimisticUpdate<T>(config: Optimistic.Config<D, T>): Promise<T> {
    const startedAt: number = Date.now(),
      KEY = 'optimistic' as const,
      { statusKey, dataKeys } = config,
      details: Telemetry.Details<D, P>[typeof KEY] = { statusKey, dataKeys }

    this.#emitMetric({ key: KEY, details })

    try {
      const optimisticUpdated: T = await this.#optimisticUpdateFn({
        runtime: {
          name: this.#name,
          rawData: this.#rawData,
          data: this.#data,
          activeApis: this.#activeApis,
          enqueue: this.#enqueue.bind(this),
          reRender: this.#reRender.bind(this),
          signal: this.#abortController.signal,
          guardKey: (key: keyof D) => this.#guardImmutableData(key)
        },
        config
      })

      this.#emitMetric({ key: KEY, startedAt, details: { ...details, result: 'success' } })
      return optimisticUpdated
    } catch (error) {
      this.#emitMetric({ key: KEY, error, startedAt, details: { ...details, result: 'reverted' } })
      throw error
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
          if (child.#clonedSelves.size > CLONED_SELVES_LENGTH) {
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

    for (const { descendants, values } of this.#propsSources) {
      addGetChildren()

      const _descendants: Descendant[] = toArray(descendants({ children: this.#children })).filter(
        (descendant: Descendant): descendant is Descendant => descendant !== undefined
      )

      this.#removePublicMethod({ method: 'getChildren' })

      if (_descendants.length === 0) continue

      const run = (): void => {
        FiCsElement.#activeEffect = { instance: this, run }

        try {
          for (const descendant of _descendants)
            for (const [key, value] of typedEntries(
              values({
                ...this.#getDataProps(true),
                children: this.#children,
                sendToWebsocket: (value: WebSocketNS.Value) =>
                  this.#webSocketProp?.isOpened() && this.#webSocketProp.send(value)
              })
            ))
              descendant.#props[key] = value
        } finally {
          FiCsElement.#activeEffect = null
        }
      }

      run()
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
    return BOOLEAN_ATTRS.has(attr.trim().toLowerCase())
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

    const template: Html.Template<D, P> = (
        strings: TemplateStringsArray,
        ...variables: (Html.Content<D, P> | unknown)[]
      ): Html.Sanitized<D, P> => ({
        [symbols.SANITIZED]: sanitize<Exclude<Html.Content<D, P>, string>>({
          strings,
          variables,
          name: this.#name,
          isFiCsElement: (variable: unknown): variable is Exclude<Html.Content<D, P>, string> =>
            variable instanceof FiCsElement
        }) as Html.Content<D, P>[]
      }),
      contents: Html.Content<D, P>[] = this.#html({
        ...this.#getDataProps(true),
        children: this.#children,
        template: (
          strings: TemplateStringsArray,
          ...variables: (Html.Content<D, P> | unknown)[]
        ): Html.Sanitized<D, P> => template(strings, ...variables),
        unsafeHtml: (str: string): Record<symbol, string> => ({ [symbols.UNSAFE_HTML]: str }),
        show: (condition: boolean): string => (condition ? '' : attrs.SHOW),
        activeApis: Object.fromEntries(this.#activeApis),
        attributes: {
          boolean: (condition: boolean | undefined): 'true' | 'false' =>
            condition ? 'true' : 'false',
          formAnchor: attrs.FORM_ANCHOR,
          statusLiveRegion: a11y.STATUS_LIVE_REGION
        },
        isBrowser: this.#isBrowser,
        isDeferred: this.#isDeferred,
        form: this.#formAssociation,
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
      })[symbols.SANITIZED]

    return contents.reduce<string>((prev, curr) => {
      if (isObject(curr) && curr instanceof FiCsElement) {
        const instanceId: string = curr.#instanceId

        this.#childrenStore[instanceId] ??= curr
        curr = `<${VAR_TAG_NAME} ${attrs.FICS_ID}="${instanceId}"></${VAR_TAG_NAME}>`
      }

      return `${prev}${curr}`
    }, '')
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
            const instanceId: string | null = childNode.getAttribute(attrs.FICS_ID)

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

          if (childNode.hasAttribute(attrs.SHOW)) {
            ;(childNode as HTMLElement).style.display = 'none'
            childNode.removeAttribute(attrs.SHOW)
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
            const { name, value, namespaceURI }: Html.PickedAttr = newAttrs[i],
              oldAttr: Omit<Html.PickedAttr, 'name'> | undefined = oldAttrList[name],
              isDiffAttr: boolean = oldAttr?.value !== value

            if (isHTMLElement(oldChildNode)) {
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
                if (name !== attrs.FICS_ID && hasProp)
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
            if (isHTMLElement(oldChildNode)) {
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

          if (!!Reflect.get(oldChildNode, convertStr(attrs.FICS_ID, 'camel'))) return

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
                  !!Reflect.get(oldChildNode, convertStr(attrs.FICS_ID, 'camel'))
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
        if (typeof selector === 'number') return selector.toString()
        if (!isSsr) return selector

        const ssrHost: string = `div#${this.#name}`

        /** @remarks Excludes `:host-context()` */
        if (/^\s*:host(?!-)/.test(selector))
          return selector
            .replace(new RegExp(`${h.GROUP}`, 'g'), `${ssrHost}$1`)
            .replace(new RegExp(`${h.STRICT}`, 'g'), ssrHost)

        return `:where(${ssrHost}) ${selector}`
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

    return css.reduce<string>((prev, curr) => {
      if (typeof curr === 'string') return `${prev}${normalizeHost(curr)}`

      const topLevelCss: string[] = [],
        joinCss = (cssTexts: string[]): string => [prev, ...cssTexts, ...topLevelCss].join('')

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
    }, '')
  }

  #buildCss(shadowRoot: ShadowRoot): void {
    const css: Css.Sheet<D, P>[] = [...FiCsElement.globalCss, ...this.#css]
    if (css.length === 0) return

    this.#styleSheet ??= new CSSStyleSheet()
    const cssText: string = this.#cssToString([`${h.ITSELF}{display:block}`, ...css])

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

    if (trimmedSelector === h.ITSELF) return [component]

    const shadowRoot: ShadowRoot = this.#getShadowRoot(component),
      isDirectChild: boolean = trimmedSelector.startsWith(`${h.ITSELF} >`)

    if (isDirectChild) {
      const directChildSelector: string = trimmedSelector
        .slice(h.ITSELF.length)
        .replace(/^\s*>\s*/, '')
        .trim()

      try {
        return Array.from(shadowRoot.children).filter((element: Element): boolean =>
          element.matches(directChildSelector)
        )
      } catch (error) {
        throw new Error(`The selector "${selector}" in ${this.#name} is invalid...`)
      }
    }

    if (trimmedSelector.startsWith(`${h.ITSELF} `))
      trimmedSelector = trimmedSelector.slice(h.ITSELF.length).trimStart()

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

  get #internals(): ElementInternals | undefined {
    const { component }: { component?: HTMLElement } = this.#cache
    return component ? formInternals.get(component) : undefined
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
        throw new Error(
          'Both "debounceMs" and "throttleMs" options cannot be used at the same time...'
        )

      const callback = (event: Event): void => {
        const attrs: Record<string, string> = {}

        for (let index = 0; index < element.attributes.length; index++) {
          const { name, value }: { name: string; value: string } = element.attributes[index]
          attrs[name] = value
        }

        method({
          ...this.#getDataProps(true),
          ref: (selector: string) => this.#queryDeeply(selector, shadowRoot),
          event,
          attributes: attrs,
          requestSubmit: this.#isFormAssociated
            ? (...args: Parameters<Form.RequestSubmit>): void =>
                this.#internals?.form?.requestSubmit(...args)
            : NOOP,
          submitForm: this.#isFormAssociated ? submitForm(event) : NOOP,
          value:
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement ||
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

  get #formAssociation(): Form.Association {
    const { component }: { component?: HTMLElement } = this.#cache

    return {
      element: this.#internals?.form ?? null,
      /** @remarks Evaluates :disabled to catch states inherited from parent fieldsets. */
      isDisabled: component?.matches(':disabled') ?? false,
      isUserInvalid:
        !!component && touchedControls.has(component) && this.#internals?.validity.valid === false
    }
  }

  #callback(key: Exclude<Hook.Key<D, P>, 'updated'>, shadowRoot?: ShadowRoot): void {
    if (this.#hooks?.[key] === undefined) return

    const ctx: Hook.Ctx<D, P> = {
        ...this.#getDataProps(true),
        ref: (selector: string) => this.#queryDeeply(selector, shadowRoot),
        debounce: this.#debounce.bind(this),
        throttle: this.#throttle.bind(this),
        signal: this.#abortController.signal,
        form: this.#formAssociation
      },
      executeHook = (callback: () => void): void => {
        const startedAt: number = Date.now()
        this.#emitMetric({ key })

        try {
          callback()
          this.#emitMetric({ key, startedAt })
        } catch (error) {
          this.#emitMetric({ key, error, startedAt })
          if (!this.#options.telemetry?.onError) throw error
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
            if ((maxRetries !== undefined && times >= maxRetries) || (exit && exit())) {
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

  #syncForm(): void {
    const { component }: { component?: HTMLElement } = this.#cache,
      { form }: Options.Resolved<D, P> = this.#options

    if (!component || !form || !this.#internals) return

    syncForm({
      element: component,
      anchor: this.#queryDeeply(`[${attrs.FORM_ANCHOR}]`),
      options: form,
      dataProps: this.#getDataProps(true),
      internals: this.#internals
    })
  }

  #define(): void {
    browserError()

    const that: FiCsElement<D, P> = this,
      { lazyLoad, rootMargin }: Options.Resolved<D, P> = that.#options,
      FiCsCustomElement = class extends HTMLElement {
        static formAssociated: boolean = that.#isFormAssociated
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
        }

        #deactivateRuntime(): void {
          this.#websocket?.close()
          this.#websocket = undefined

          this.#eventSource?.close()
          this.#eventSource = undefined

          this.#removeEventListeners?.()
          this.#removeEventListeners = undefined
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
                    i18n: async <T>({ lang, key }: Parameters<I18n['i18n']>[0]) =>
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
          Reflect.set(this, convertStr(attrs.FICS_ID, 'camel'), that.#instanceId)

          that.#cache.component = this
          this.#activateRuntime()
        }

        async connectedCallback(): Promise<void> {
          if (that.#abortController.signal.aborted) that.#abortController = new AbortController()

          if (this.#isRendered) this.#activateRuntime()
          else {
            const mount = (): void => {
              this.#init()
              that.#callback('mounted', this.#shadowRoot)
              /** @remarks Performs the initial form sync, which is the only update for components never re-render. */
              that.#syncForm()
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

          if (!that.#abortController.signal.aborted) that.#abortController.abort()

          this.#deactivateRuntime()

          if (that.#scrollObservers) {
            for (const observer of ['intersection', 'mutation', 'resize'] as const)
              that.#scrollObservers[observer]?.disconnect()

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

        formResetCallback(): void {
          that.#options.form?.reset?.(that.#getDataProps(true))
          that.#syncForm()
          that.#enqueue(that.#reRender.bind(that), 're-render')
        }

        formDisabledCallback(): void {
          /** @remarks Triggers a re-render to propagate the native disabled state into the Shadow DOM. */
          that.#enqueue(that.#reRender.bind(that), 're-render')
        }
      }

    /** @remarks Injects standard form APIs into the prototype for form-associated components. */
    if (that.#isFormAssociated) defineFormSurface(FiCsCustomElement.prototype)

    window.customElements.define(that.#name, FiCsCustomElement)
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
            i18n: async <T>({ lang, key }: Parameters<I18n['i18n']>[0]) => i18n<T>({ lang, key })
          })
        )) {
          const _key: keyof D = key as keyof D
          if (!deepEqual(this.#data[_key], value)) this.#data[_key] = value as D[keyof D]
        }

      /** @remarks Syncs the final state to the form, allowing custom validation to append data before rendering. */
      this.#syncForm()

      const shadowRoot: ShadowRoot = this.#getShadowRoot(component)

      if (!isOnlyHtml) {
        this.#setClassNames(component)
        this.#setAttrs(component)
        this.#buildCss(shadowRoot)
      }

      this.#buildHtml(shadowRoot)
      this.#infiniteVirtualScroll(shadowRoot)

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

  #assertDescribed(methodName: string): void {
    if (!this.#hasDescribed)
      throw new Error(
        `The ${methodName} method cannot be called before calling the describe method in ${this.#name}...`
      )
  }

  #guardImmutableData(key: keyof D): void {
    if (this.#immutableDataKeys.has(key))
      throw new Error(`The "${String(key)}" is read-only in ${this.#name}...`)
  }

  getChildren(): Children {
    throw new Error(`The getChildren method is not implemented in the ${this.#name}...`)
  }

  setIndividualProps(_1: string | number, _2: P): FiCsElement<D, P> {
    throw new Error(`The setIndividualProps method is not implemented in the ${this.#name}...`)
  }

  toString({ data, queryCache }: { data?: Partial<D>; queryCache?: QueryCache } = {}): string {
    if (this.#isBrowser)
      throw new Error(
        `The "toString" method can only be called in the server environment in ${this.#name}...`
      )

    const render = (that: FiCsElement<D, P>, data?: Partial<D>): string => {
      that.#ssrQueryCache = queryCache ??= createQueryCache()

      try {
        that.#initProps()

        if (!that.#options.ssr) return `<${that.#name}></${that.#name}>`

        const attrs: string[] = []
        if (that.#classNames && !isBlankString(that.#computedClassName))
          attrs.push(`class="${escape(that.#computedClassName)}"`)

        if (that.#computedAttrs.length > 0)
          for (const [key, value] of that.#computedAttrs)
            if (that.#isBooleanAttrEnabled(key, value)) attrs.push(escape(key))
            else if (!that.#isBooleanAttr(key)) attrs.push(`${escape(key)}="${escape(value)}"`)

        const slotAttrs: string = [
            `id="${that.#name}"`,
            `slot="${that.#instanceId}"`,
            `${data ? `data-${that.#name}="${escape(JSON.stringify(data))}"` : ''}`
          ]
            .filter(Boolean)
            .join(' '),
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
          <${[that.#name, ...attrs].join(' ')}>
            <template shadowrootmode="open"${that.#isFormAssociated ? ' shadowrootdelegatesfocus' : ''}>
              <slot name="${that.#instanceId}"></slot>
            </template>
            <div ${slotAttrs}>${html}${css([...FiCsElement.globalCss, ...that.#css])}</div>
          </${that.#name}>
        `
      } finally {
        that.#ssrQueryCache = null
      }
    }

    if (data) for (const [key, value] of typedEntries(data as D)) this.#rawData[key] = value
    return render(this, data)
  }

  describe(parent?: HTMLElement): void {
    if (this.#isBrowser) lockQueryCache()
    this.#initProps()
    this.#hasDescribed = true
    this.#callback('created')
    this.#enqueue(this.#define.bind(this), 'define')
    if (parent) parent.append(document.createElement(this.#name))
  }

  setData<K extends keyof D>(key: K, value: D[K]): void {
    this.#assertDescribed('setData')
    this.#guardImmutableData(key)
    this.#data[key as keyof D] = value as D[keyof D]
  }

  setDataOptimistically<T>(config: Optimistic.Config<D, T>): Promise<T> {
    this.#assertDescribed('setDataOptimistically')
    return this.#optimisticUpdate(config)
  }

  getData<K extends keyof D>(key: K): D[typeof key] {
    this.#assertDescribed('getData')
    return this.#data[key] as D[typeof key]
  }
}
