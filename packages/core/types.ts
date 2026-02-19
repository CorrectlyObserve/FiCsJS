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
    ctx: DataProps<D, P, true> & {
      event: Event
      ref: (selector: string) => Element | null
      attributes: Record<string, string>
      value?: string
    }
  ) => void

  interface Options {
    debounce?: number
    throttle?: number
    blur?: boolean
    once?: boolean
  }
}

export type Attrs<D extends object, P> = ValueOrFn<D, P, Record<string, string>>

export type Children = Record<string, Descendant>

export type ClassName<D extends object, P> = ValueOrFn<D, P, string>

export declare namespace Crud {
  interface Ctx {
    api: string
    apiStatuses: Map<string, boolean>
    enqueue: (func: () => void, key: Task['key']) => void
    reRender: (isOnlyHtml?: boolean) => Promise<void>
    options?: Options | StreamOptions
  }

  type Fn = {
    <T>(api: string, options?: Options): Promise<T>
    (api: string, options: StreamOptions): Promise<void>
  }

  interface Options extends RequestInit {
    key?: string
    timeout?: number
    maxRetry?: number
    delay?: number
  }

  interface StreamOptions extends Options {
    /**
     * @remarks The chunk is NOT sanitized. Be cautious of XSS vulnerabilities.
     */
    onChunk: (chunk: string, index: number) => void
  }
}

export declare namespace Css {
  interface Declarations {
    [key: string]: string | number | undefined | Declarations
  }

  type Global = string | { [key: string]: string | number | Exclude<Global, string> }

  type Rules<D extends object, P> = Record<string, Value<D, P>>

  type Sheet<D extends object, P> = Rules<D, P> | Global

  type Value<D extends object, P> = ValueOrFn<D, P, Declarations>
}

export type DataProps<D extends object, P, B extends boolean = false> = {
  data: D
  props: P
} & (B extends true ? { crud: Crud.Fn } : {})

export type Descendant = FiCsElement<any, any>

export interface FiCs<D extends object, P extends object> {
  name: string
  isExceptional?: boolean
  instanceId?: string
  children?: Descendant[]
  data?: () => Partial<D>
  deferredData?: (ctx: DataProps<D, P, true>) => Promise<Partial<D>>
  i18nData?: (ctx: DataProps<D, P, false> & I18n) => Promise<Partial<D>>
  props?: SingleOrArray<Props<D, P>>
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  html: Html.Core<D, P>
  css?: SingleOrArray<Css.Rules<D, P> | string>
  clonedCss?: Css.Sheet<D, P>[]
  hooks?: Hook.Lifecycle<D, P>
  actions?: Action.Handlers<D, P>
  options?: Options.Ctx<D, P>
}

type GetDataProps<D extends object, P> = <B extends boolean = false>(
  isCrud?: B
) => DataProps<D, P, B>

export declare namespace Html {
  type Content<D extends object, P extends object> =
    | ([D, P] extends [object, object] ? Descendant : FiCsElement<D, P>)
    | string

  type Core<D extends object, P extends object> = (
    ctx: Omit<DataProps<D, P, true>, 'props'> &
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
    html: (str: string) => Record<symbol, string>
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
  interface Ctx<D extends object, P> extends DataProps<D, P, true> {
    ref: (selector: string) => Element | null
    debounce: RateLimitFn
    throttle: RateLimitFn
  }

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
    interval: number
    max?: number
    exit?: () => boolean
  }
}

export interface I18n {
  i18n: <T>({ lang, key }: { lang: string; key: SingleOrArray<string> }) => Promise<T>
}

export declare namespace Options {
  interface Ctx<D extends object, P> extends Omit<Resolved<D, P>, 'ssr' | 'scroll'> {
    ssr?: boolean
    scroll?: (ctx: DataProps<D, P, true>) => Scroll.Options
  }

  interface Resolved<D extends object, P> {
    ssr: boolean
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
    ctx: DataProps<D, P, true> & { children: Children } & {
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

  namespace Ctx {
    interface OffsetBeforeIndex {
      cache: Scroll.Cache | undefined
      totalCount: number
      index: number
      aveSize: number
    }

    interface Runtime<D extends object, P> {
      name: string
      instanceId: string
      shadowRoot: ShadowRoot
      getDataProps: GetDataProps<D, P>
      scrollOptions: Resolved<D, P> | undefined
      enqueue: (func: () => void, key: Task['key']) => void
      addEventListener: (ctx: Action.Ctx<D, P>) => void
      reRender: (isOnlyHtml?: boolean) => Promise<void>
      scrollObservers: Scroll.Observers | undefined
      setScrollObservers: (observers?: Scroll.Observers) => void
    }

    interface Template<D extends object, P extends object, T> {
      instanceId: string
      getDataProps: GetDataProps<D, P>
      template: Html.Template<D, P>
      scrollOptions: Resolved<D, P> | undefined
      array: ReadonlyArray<T> | null | undefined
      callback: (item: T, index: number) => Html.Sanitized<D, P>
    }
  }

  type Div = 'wrap' | 'sentinel'

  interface Metrics {
    current: number
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
    unit: number
    itemMinSize: number
    axis: Axis
    trigger?: boolean
    parameter?: string
    rootMargin?: string | number
    bufferLength?: number
    cacheLength?: number
    throttle?: number
    thresholdRate?: number
    method: () => void
  }

  interface Resolved<D extends object, P> extends Runtime {
    cache: Cache
    options: (ctx: DataProps<D, P, true>) => Options
  }

  interface Runtime {
    id: string
    isEnabled: boolean
    startIndex: number
    endIndex: number
    aveSize: number
    totalSize: number
    totalCount: number
    prevTotalSize: number
    prevTotalCount: number
    flags: {
      hasScrolled: boolean
      isRangeLockedUntilScroll: boolean
      isFetchLockedUntilScroll: boolean
      isAxisResetPending: boolean
    }
    fetch: { isFetching: boolean; lastTriggeredCount: number }
    firstVisible: { index?: number; key?: string; offset?: number }
    timers: { resize?: SetTimeout; idle?: SetTimeout }
    urlSync: { index?: number; pageParam?: number }
    lastAxis?: Axis
  }
}

export type SetTimeout = ReturnType<typeof setTimeout>

export type SingleOrArray<T> = T | T[]

export declare namespace SSE {
  interface Ctx<D extends object, P> {
    options: Options<D, P> | undefined
    getDataProps: GetDataProps<D, P>
    debounce: RateLimitFn
    throttle: RateLimitFn
  }

  type Method<D extends object, P> = (
    ctx: DataProps<D, P, true> & { event: MessageEvent; close: () => void }
  ) => void

  interface Options<D extends object, P> {
    path: string
    withCredentials?: boolean
    onopen?: (ctx: DataProps<D, P, true> & { event: Event; close: () => void }) => void
    onmessage?: Method<D, P>
    onerror?: (ctx: DataProps<D, P, true> & { event: Event; close: () => void }) => void
    actions: Record<string, Method<D, P> | [Method<D, P>, Omit<Action.Options, 'blur'>]>
  }
}

export interface Task {
  instanceId: string
  func: () => void
  key: 'define' | 're-render' | 'fetch'
}

export type Translations = Record<string, unknown>

type ValueOrFn<D extends object, P, T> = T | ((ctx: DataProps<D, P>) => T)

export declare namespace WebSocket {
  namespace Ctx {
    interface Fn<D extends object, P> {
      options: WebSocket.Options<D, P> | undefined
      getDataProps: GetDataProps<D, P>
      setWebSocketProp: (value?: WebSocket.Prop) => void
    }

    interface Params<D extends object, P> extends DataProps<D, P, true> {
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

  interface Options<D extends object, P> {
    path: string
    protocols?: SingleOrArray<string>
    reconnect?: { interval: number; max?: number; isExponential?: boolean }
    onopen?: (ctx: Ctx.Params<D, P> & { event: Event }) => void
    onmessage?: (ctx: Ctx.Params<D, P> & { event: MessageEvent }) => void
    onerror?: (ctx: Ctx.Params<D, P> & { event: Event }) => void
    onclose?: (ctx: Ctx.Params<D, P> & { event: CloseEvent }) => void
  }

  interface Prop {
    send: (value: Value) => void
    isOpened: () => boolean
  }

  type Value = string | Blob | ArrayBuffer | ArrayBufferView
}
