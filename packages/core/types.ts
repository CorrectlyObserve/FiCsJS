import FiCsElement from './class'
import consts from './constants'

export declare namespace Action {
  interface Ctx<D extends object, P> {
    element: Element
    shadowRoot: ShadowRoot
    entries: [string, Action.Method<D, P> | [Action.Method<D, P>, Action.Options]][]
  }

  type Handlers<D extends object, P> = Record<
    string,
    Record<string, Method<D, P> | [Method<D, P>, Options]>
  >

  type Method<D extends object, P> = (
    ctx: DataProps.Payload<D, P, true> & {
      event: Event
      ref: (selector: string) => Element | null
      attributes: Record<string, string>
      value?: string
    }
  ) => void

  interface Options {
    debounceMs?: number
    throttleMs?: number
    blur?: boolean
    once?: boolean
  }
}

export type Attrs<D extends object, P> = ValueOrFn<D, P, Record<string, string>>

export type Children = Record<string, Descendant>

export type ClassName<D extends object, P> = ValueOrFn<D, P, string>

export declare namespace Crud {
  interface Ctx {
    endpoint: string
    apiStatuses: Map<string, boolean>
    enqueue: (func: () => Void, key: Task['key']) => void
    reRender: (isOnlyHtml?: boolean) => Promise<void>
    options?: Options | StreamOptions
  }

  type Fetcher = {
    <T>(endpoint: string, options?: Options): Promise<T>
    (endpoint: string, options: StreamOptions): Promise<void>
  }

  interface Options extends RequestInit {
    key?: string
    timeoutMs?: number
    intervalMs?: number
    maxRetries?: number
    signal?: AbortSignal
  }

  interface StreamOptions extends Options {
    /** @remarks The chunk is NOT sanitized. Be cautious of XSS vulnerabilities. */
    onChunk: (chunk: string, index: number) => void
  }
}

export declare namespace Css {
  type Ctx<D extends object, P> = SingleOrArray<StringOrFn<D, P> | Css.Rules<D, P>>

  interface Declarations {
    [key: string]: string | number | undefined | Declarations
  }

  type Global = StringOrFn<any, any> | Record<string, Declarations>

  type Rules<D extends object, P> = Record<string, Value<D, P>>

  type Sheet<D extends object, P> = Rules<D, P> | Global

  type StringOrFn<D extends object, P> =
    | string
    | ((
        ctx: DataProps.Payload<D, P> & { cssToString: (declarations: Declarations) => string }
      ) => string)

  type Value<D extends object, P> = ValueOrFn<D, P, Declarations>
}

export declare namespace DataProps {
  type Getter<D extends object, P> = <B extends boolean = false>(isCrud?: B) => Payload<D, P, B>

  type Payload<D extends object, P, B extends boolean = false> = {
    data: D
    props: P
  } & (B extends true ? { crud: Crud.Fetcher } : {})
}

export type Descendant = FiCsElement<any, any>

export interface FiCs<D extends object, P extends object> {
  name: string
  isExceptional?: boolean
  instanceId?: string
  children?: Descendant[]
  data?: () => Partial<D>
  deferredData?: (ctx: DataProps.Payload<D, P, true>) => Promise<Partial<D>>
  i18nData?: (ctx: DataProps.Payload<D, P> & I18n) => Promise<Partial<D>>
  props?: SingleOrArray<Props<D, P>>
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  html: Html.Core<D, P>
  css?: Css.Ctx<D, P>
  clonedCss?: Css.Sheet<D, P>[]
  hooks?: Hook.Lifecycle<D, P>
  actions?: Action.Handlers<D, P>
  options?: Options.Ctx<D, P>
}

export declare namespace Html {
  type Content<D extends object, P extends object> =
    | ([D, P] extends [object, object] ? Descendant : FiCsElement<D, P>)
    | string

  type Core<D extends object, P extends object> = (
    ctx: Omit<DataProps.Payload<D, P, true>, 'props'> &
      Syntaxes<D, P> & {
        isBrowser: boolean
        isDeferred: boolean
        scroll: <T>(
          array: ReadonlyArray<T> | null | undefined,
          callback: (item: T, index: number) => Sanitized<D, P>
        ) => Sanitized<D, P>
      }
  ) => Sanitized<D, P>

  type PickedAttr = Pick<Attr, 'name' | 'value' | 'namespaceURI' | 'localName'>

  type Sanitized<D extends object, P extends object> = Record<symbol, Content<D, P>[]>

  interface Syntaxes<D extends object, P extends object> {
    children: Children
    props: P
    template: Template<D, P>
    unsafeHtml: (str: string) => Record<symbol, string>
    show: (condition: boolean) => string
    apiStatuses: Record<string, boolean>
    attributes: {
      boolean: (condition: boolean | undefined) => 'true' | 'false'
      statusLiveRegion: typeof consts.a11y.STATUS_LIVE_REGION
    }
  }

  type Template<D extends object, P extends object> = (
    templates: TemplateStringsArray,
    ...variables: (Content<D, P> | unknown)[]
  ) => Sanitized<D, P>
}

export declare namespace Hook {
  interface Ctx<D extends object, P> extends DataProps.Payload<D, P, true> {
    ref: (selector: string) => Element | null
    debounce: RateLimitFn
    throttle: RateLimitFn
  }

  type Key<D extends object, P> = keyof Lifecycle<D, P>

  interface Lifecycle<D extends object, P> {
    created?: (ctx: Ctx<D, P>) => void
    mounted?: (
      ctx: Ctx<D, P> & {
        poll: (func: ({ times }: { times: number }) => void, options: Polling) => void
      }
    ) => void
    updated?: { [K in keyof D]?: (ctx: Ctx<D, P>) => void }
    destroyed?: (ctx: Ctx<D, P>) => void
    adopted?: (ctx: Ctx<D, P>) => void
  }

  interface Polling {
    intervalMs: number
    maxRetries?: number
    exit?: () => boolean
  }
}

export interface I18n {
  i18n: <T>({ lang, key }: { lang: string; key: SingleOrArray<string> }) => Promise<T>
}

export declare namespace Options {
  interface Ctx<D extends object, P> extends Omit<Resolved<D, P>, 'ssr' | 'rootMargin' | 'scroll'> {
    ssr?: boolean
    /** @param rootMargin Must be an integer if it is a number. */
    rootMargin?: string | number
    scroll?: (ctx: DataProps.Payload<D, P, true>) => Scroll.Options
  }

  interface Resolved<D extends object, P> {
    ssr: boolean
    telemetry?: Telemetry.Options<D, P>
    lazyLoad?: boolean
    rootMargin?: string
    websocket?: WebSocket.Options<D, P>
    sse?: SSE.Options<D, P>
    scroll?: Scroll.Resolved<D, P>
  }
}

export interface Props<D extends object, P> {
  descendant: (ctx: { children: Children }) => SingleOrArray<Descendant>
  values: (
    ctx: DataProps.Payload<D, P, true> & { children: Children } & {
      sendToWebsocket: (value: WebSocket.Value) => void
    }
  ) =>
    | Record<
        string,
        ({
          getData,
          sendToWebsocket
        }: {
          getData: <K extends keyof D>(
            key: K
          ) => D[K] extends (...args: infer A) => infer R ? (...args: A) => R : D[K]
          sendToWebsocket?: (value: WebSocket.Value) => void
        }) => unknown
      >
    | Record<string, unknown>
}

export declare namespace Query {
  type Api = Pick<
    QueryCache<unknown>,
    'setQuery' | 'getQuery' | 'expire' | 'abort' | 'prefetch' | 'optimisticUpdate'
  >

  interface Callback<D extends object, P, T> {
    onSuccess: (ctx: DataProps.Payload<D, P, true>, value: T) => void
    onError?: (ctx: DataProps.Payload<D, P, true>, error: unknown) => void
    onFetching?: (ctx: DataProps.Payload<D, P, true>) => void
  }

  namespace Config {
    interface Entry {
      staleMs?: number
      maxRetries?: number
      refetchIntervalMs?: number
    }

    interface Global {
      staleMs: number
      gcLimitMs: number
      maxDelayMs: number
      maxRetries: number
      refetchIntervalMs: number
      refetchOnFocus: boolean
      refetchOnReconnect: boolean
      onMetric?: (event: Metric.Event) => void
      onError?: (key: Key, error: unknown) => void
    }
  }

  interface EndOptimisticUpdate<T> {
    entry: Query.Entry<T>
    result: Result
    attempt: number
    startedAt: number
  }

  interface Ensure<T> {
    key: Query.Key
    fetcher?: Query.Fetcher<T>
    config?: Config.Entry
  }

  interface Entry<T> {
    readonly key: Key
    readonly hashed: string
    state: State<T>
    fetcher: Fetcher<T> | null
    staleMs: number
    maxDelayMs: number
    maxRetries: number
    refetchIntervalMs: number
    subscribers: Set<string>
    inflight: Promise<void> | null
    abort: AbortController | null
    isOptimistic: boolean
    fetchId: number
    gcTimer?: SetTimeout
    refetchTimer?: ReturnType<typeof setInterval>
    lastOptimisticTask?: Promise<void>
  }

  interface Filter<T> {
    key?: Key
    isExactlyMatched?: boolean
    predicate?: (entry: { key: Key; state: State<T> }) => boolean
  }

  type Fetcher<T> = (ctx: { key: Key; signal: AbortSignal }) => Promise<T>

  type Key = readonly unknown[]

  type Listener<T> = (hashed: string, state: State<T>) => void

  namespace Metric {
    type Event = { module: 'query-cache' } & Payload

    type Payload =
      | { type: 'fetch:start'; key: Key; attempt: number }
      | { type: 'fetch:success'; key: Key; attempt: number; durationMs: number }
      | {
          type: 'fetch:error'
          key: Key
          attempt: number
          durationMs: number
          error: unknown
          willRetry: boolean
        }
      | { type: 'cache:update'; key: Key; source: 'fetch' | 'manual' | 'optimistic' }
      | { type: 'cache:evict'; key: Key; reason: 'gc' | 'destroy' }
      | { type: 'subscribe'; key: Key; subscriberCount: number }
      | { type: 'unsubscribe'; key: Key; subscriberCount: number }
      | { type: 'optimistic:enqueue'; key: Key }
      | { type: 'optimistic:start'; key: Key }
      | { type: 'optimistic:end'; key: Key; result: Result; attempt: number; durationMs: number }
  }

  interface OptimisticUpdate<T> {
    key: Query.Key
    newQuery: T | ((current: T | undefined) => T)
    updater: () => Promise<T>
    maxRetries?: number
    signal?: AbortSignal
  }

  interface Options<D extends object, P, T> extends Config.Entry, Callback<D, P, T> {
    key: Key
    fetcher: Fetcher<T>
    enabled?: boolean
  }

  type Result = 'success' | 'reverted'

  interface Runtime<D extends object, P, T> {
    instanceId: string
    getDataProps: DataProps.Getter<D, P>
    options?: (ctx: DataProps.Payload<D, P, true>) => Options<D, P, T>[]
  }

  interface Subscription<T> {
    hashed: string
    instanceId: string
    listener: Listener<T>
  }

  interface State<T> {
    value?: T
    error?: unknown
    isFetching: boolean
    /** @remarks `0` means the data has never been fetched. */
    updatedAt: number
  }
}

type RateLimitFn = <T extends unknown[]>(
  func: (...args: T) => void,
  time: number
) => (...args: T) => void

export declare namespace Scroll {
  type Axis = 'vertical' | 'horizontal'

  interface Cache {
    elementSizes: Map<string, number>
    indexSizes: Map<number, number>
    indexKeys: Map<number, string>
    elementIndexes: WeakMap<Element, number>
    maxLength: number
    startIndex: number
    evictedSize: number
    evictedCount: number
    sizeFenwickTree: number[]
    countFenwickTree: number[]
  }

  interface Clamped extends Omit<Options, 'bufferLength' | 'throttleMs' | 'thresholdRatio'> {
    bufferLength: number
    throttleMs: number
    thresholdRatio: number
  }

  namespace Ctx {
    interface OffsetBeforeIndex {
      cache?: Scroll.Cache
      totalCount: number
      index: number
      aveSize: number
    }

    interface Runtime<D extends object, P> {
      name: string
      instanceId: string
      shadowRoot: ShadowRoot
      getDataProps: DataProps.Getter<D, P>
      scrollOptions: Resolved<D, P> | undefined
      addEventListener: (ctx: Action.Ctx<D, P>) => void
      reRender: () => void
      scrollObservers: Scroll.Observers | undefined
      setScrollObservers: (observers?: Scroll.Observers) => void
    }

    interface Template<D extends object, P extends object, T> {
      instanceId: string
      getDataProps: DataProps.Getter<D, P>
      template: Html.Template<D, P>
      scrollOptions: Resolved<D, P> | undefined
      array: ReadonlyArray<T> | null | undefined
      callback: (item: T, index: number) => Html.Sanitized<D, P>
    }
  }

  type Div = 'wrap' | 'sentinel'

  interface Metrics {
    scrollOffset: number
    scrollAmount: number
    clientSize: number
  }

  interface Observers {
    root: HTMLElement
    intersection: IntersectionObserver
    mutation: MutationObserver
    resize: ResizeObserver
  }

  interface Options {
    /** @param unit Must be a positive integer. */
    unit: number
    /** @param itemMinSize Must be a positive number. */
    itemMinSize: number
    axis: Axis
    trigger?: boolean
    parameter?: string
    /** @param rootMargin Must be an integer if it is a number. */
    rootMargin?: string | number
    /** @param bufferLength Must be a non-negative integer. */
    bufferLength?: number
    /** @param cacheLength Must be a non-negative integer. */
    cacheLength?: number
    /** @param throttleMs Must be a non-negative integer. */
    throttleMs?: number
    /** @param thresholdRatio Must be a number between 0 and 1. */
    thresholdRatio?: number
    method: () => void
    onError?: (error: unknown) => void
  }

  interface Resolved<D extends object, P> extends Runtime {
    cache: Cache
    options: (ctx: DataProps.Payload<D, P, true>) => Options
  }

  interface Runtime {
    id: string
    isEnabled: boolean
    startIndex: number
    endIndex: number
    aveSize: number
    totalSize: number
    totalCount: number
    prevTotalCount: number
    flags: {
      hasScrolled: boolean
      isRangeLocked: boolean
      isFetchLocked: boolean
      shouldRestoreAxisOffset: boolean
    }
    fetch: { isFetching: boolean; lastTriggeredCount: number }
    firstVisible: { index?: number; key?: string; offset?: number }
    timers: { resize?: SetTimeout; idle?: SetTimeout }
    urlSync: { index?: number; pageParam?: number; parameter?: string; unit?: number }
    lastAxis?: Axis
  }
}

export type SetTimeout = ReturnType<typeof setTimeout>

export type SingleOrArray<T> = T | T[]

export declare namespace SSE {
  interface Ctx<D extends object, P> {
    options: Options<D, P> | undefined
    getDataProps: DataProps.Getter<D, P>
    debounce: RateLimitFn
    throttle: RateLimitFn
  }

  type Method<D extends object, P> = (
    ctx: DataProps.Payload<D, P, true> & { event: MessageEvent; close: () => void }
  ) => void

  interface Options<D extends object, P> {
    path: string
    withCredentials?: boolean
    onopen?: (ctx: DataProps.Payload<D, P, true> & { event: Event; close: () => void }) => void
    onmessage?: Method<D, P>
    onerror?: (ctx: DataProps.Payload<D, P, true> & { event: Event; close: () => void }) => void
    actions: Record<string, Method<D, P> | [Method<D, P>, Omit<Action.Options, 'blur'>]>
  }
}

export interface Task {
  instanceId: string
  func: () => Void
  key: 'define' | 're-render' | 'fetch'
}

export declare namespace Telemetry {
  interface Crud {
    key: string
    endpoint: string
    method: string
    isStream: boolean
    durationMs: number
  }

  interface Ctx<D extends object, P> {
    key: keyof Telemetry.Detail<D, P>
    error?: unknown
    startedAt?: number
    detail: Detail<D, P>[Ctx<D, P>['key']]
  }

  interface Detail<D extends object, P> {
    queue: { key: Task['key']; durationMs: number }
    crud: Crud
    updated: { key: 'updated'; dataKey: keyof D; durationMs: number }
    hook: { key: Exclude<Hook.Key<D, P>, 'updated'>; durationMs: number }
  }

  interface Metric<D extends object, P> extends Ctx<D, P> {
    status: Status
    name: string
    instanceId: string
    timestamp: number
  }

  interface Options<D extends object, P> {
    onMetric?: (metric: Metric<D, P>) => void
    onError?: (metric: Metric<D, P>) => void
  }

  type Status = 'starting' | 'success' | 'error'
}

export declare namespace Template {
  type AttrToken =
    | { type: 'name'; value: string }
    | { type: 'equal-sign'; value: '=' }
    | { type: 'value'; value: string }

  interface ForSsr {
    html: string
    resolveInstanceId: (instanceId: string) => string
  }

  interface Parsed {
    name: string
    fragment: string
    index: number
    quote: Template.Quote
  }

  interface Sanitized<T> {
    strings: TemplateStringsArray
    variables: unknown[]
    name: string
    isFiCsElement: (variable: unknown) => variable is T
  }

  type Context = Quote | 'text' | 'tag'
  type Quote = '"' | "'"
  type Variable<T> = (T | string)[] | string
}

export type Translations = Record<string, unknown>

type ValueOrFn<D extends object, P, T> = T | ((ctx: DataProps.Payload<D, P>) => T)

export type Void = void | Promise<void>

export declare namespace WebSocket {
  namespace Ctx {
    interface Fn<D extends object, P> {
      options: WebSocket.Options<D, P> | undefined
      getDataProps: DataProps.Getter<D, P>
      setWebSocketProp: (value?: WebSocket.Prop) => void
    }

    interface Params<D extends object, P> extends DataProps.Payload<D, P, true> {
      websocket: {
        send: (value: Value) => void
        readyState: () => number
        bufferedAmount: () => number
        binaryType: () => BinaryType
        url: () => string
        protocol: () => string
        extensions: () => string
      }
    }
  }

  interface Runtime {
    close: () => void
  }

  interface Options<D extends object, P> {
    path: string
    protocols?: SingleOrArray<string>
    /**
     * @param intervalMs Must be a non-negative integer.
     * @param maxRetries Must be a non-negative integer if it is a number.
     */
    reconnect?: { intervalMs: number; maxRetries?: number }
    onopen?: (ctx: Ctx.Params<D, P> & { event: Event }) => void
    onmessage?: (ctx: Ctx.Params<D, P> & { event: MessageEvent }) => void
    onerror?: (ctx: Ctx.Params<D, P> & { event: Event }) => void
    onclose?: (ctx: Ctx.Params<D, P> & { event: CloseEvent }) => void
  }

  interface Prop {
    send: (value: Value) => void
    isOpened: () => boolean
  }

  type Value = string | Blob | BufferSource
}
