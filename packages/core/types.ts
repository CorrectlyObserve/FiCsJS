import FiCsElement from './class'
import consts from './constants'

export declare namespace Action {
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

export type Attrs<D extends object, P> =
  | Record<string, string>
  | ((dataProps: DataProps<D, P>) => Record<string, string>)

export type Children = Record<string, Descendant>

export type ClassName<D extends object, P> = string | ((dataProps: DataProps<D, P>) => string)

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
      @remarks The chunk is NOT sanitized. Be cautious of XSS vulnerabilities.
    */
    onChunk: (chunk: string, index: number) => void
  }
}

export type Css<D extends object, P> = CssContent<D, P> | GlobalCss

export type CssContent<D extends object, P> = Record<string, Style<D, P>>

export type DataProps<D extends object, P, B extends boolean = false> = {
  data: D
  props: P
} & (B extends true ? { crud: Crud.Fn } : {})

export interface DebounceThrottle {
  debounce: <T extends (...args: Parameters<T>) => void>(
    func: T,
    time: number
  ) => (...args: Parameters<T>) => void
  throttle: <T extends (...args: Parameters<T>) => void>(
    func: T,
    time: number
  ) => (...args: Parameters<T>) => void
}

export type Descendant = FiCsElement<any, any>

export interface FiCs<D extends object, P extends object> {
  name: string
  isExceptional?: boolean
  instanceId?: string
  componentId?: string
  children?: Descendant[]
  data?: () => Partial<D>
  deferredData?: (ctx: DataProps<D, P, true>) => Promise<Partial<D>>
  i18nData?: (ctx: DataProps<D, P, false> & I18n) => Promise<Partial<D>>
  props?: SingleOrArray<Props<D, P>>
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  html: Html<D, P>
  css?: SingleOrArray<CssContent<D, P> | string>
  clonedCss?: Css<D, P>[]
  hooks?: Hooks<D, P>
  actions?: Action.Handlers<D, P>
  options?: OptionsCtx<D, P>
}

export type GetDataProps<D extends object, P extends object> = <B extends boolean = false>(
  isCrud?: B
) => DataProps<D, P, B>

export declare namespace Html {
  type Content<D extends object, P extends object> =
    | ([D, P] extends [object, object] ? Descendant : FiCsElement<D, P>)
    | string

  type Core<D extends object, P extends object> = (
    ctx: Omit<DataProps<D, P, true>, 'props' | 'getData'> &
      Syntaxes<D, P> & {
        isBrowser: boolean
        isDeferred: boolean
        scroll: <T>(
          array: T[],
          callback: (item: T, index: number) => Sanitized<D, P>
        ) => Sanitized<D, P>
      }
  ) => Sanitized<D, P>

  type PickedAttr = Pick<Attr, 'name' | 'value' | 'namespaceURI' | 'localName'>

  type Sanitized<D extends object, P extends object> = Record<symbol, Content<D, P>[]>

  interface Syntaxes<D extends object, P extends object> {
    children: Children
    props: P
    template: (
      templates: TemplateStringsArray,
      ...variables: (Content<D, P> | unknown)[]
    ) => Sanitized<D, P>
    html: (str: string) => Record<symbol, string>
    show: (condition: boolean) => string
    apiStatuses: Record<string, boolean>
    attributes: {
      boolean: (condition: boolean | undefined) => 'true' | 'false'
      statusLiveRegion: typeof consts.a11y.STATUS_LIVE_REGION
    }
  }
}

export interface HooksCtx<D extends object, P> extends DataProps<D, P, true>, DebounceThrottle {
  ref: (selector: string) => Element | null
}

export interface Hooks<D extends object, P> {
  created?: (ctx: HooksCtx<D, P>) => void
  mounted?: (
    ctx: HooksCtx<D, P> & {
      poll: (func: ({ times }: { times: number }) => void, options: PollingOptions) => void
    }
  ) => void
  updated?: { [K in keyof D]?: (ctx: HooksCtx<D, P>) => void }
  destroyed?: (ctx: HooksCtx<D, P>) => void
  adopted?: (ctx: HooksCtx<D, P>) => void
}

export interface I18n {
  i18n: <T>({ lang, key }: { lang: string; key: SingleOrArray<string> }) => Promise<T>
}

export type Method<D extends object, P> = (
  ctx: DataProps<D, P, true> & {
    event: Event
    ref: (selector: string) => Element | null
    attributes: Record<string, string>
    value?: string
  }
) => void

export interface Options<D extends object, P> {
  ssr: boolean
  lazyLoad?: boolean
  rootMargin?: string
  websocket?: {
    path: string
    protocols?: SingleOrArray<string>
    reconnect?: { interval: number; max?: number; isExponential?: boolean }
    onopen?: (ctx: WebSocketCtx<D, P> & { event: Event }) => void
    onmessage?: (ctx: WebSocketCtx<D, P> & { event: MessageEvent }) => void
    onerror?: (ctx: WebSocketCtx<D, P> & { event: Event }) => void
    onclose?: (ctx: WebSocketCtx<D, P> & { event: CloseEvent }) => void
  }
  sse?: {
    path: string
    withCredentials?: boolean
    onopen?: (ctx: DataProps<D, P, true> & { event: Event; close: () => void }) => void
    onmessage?: SSEMethod<D, P>
    onerror?: (ctx: DataProps<D, P, true> & { event: Event; close: () => void }) => void
    actions: Record<string, SSEMethod<D, P> | [SSEMethod<D, P>, Omit<ActionOptions, 'blur'>]>
  }
  scroll?: Scroll<D, P>
}

export interface OptionsCtx<D extends object, P> extends Omit<Options<D, P>, 'ssr' | 'scroll'> {
  ssr?: boolean
  scroll?: ScrollCtx<D, P>
}

export type PickedAttr = Pick<Attr, 'name' | 'value' | 'namespaceURI' | 'localName'>

export interface PollingOptions {
  interval: number
  max?: number
  exit?: () => boolean
}

export interface Props<D extends object, P> {
  descendant: (ctx: { children: Children }) => SingleOrArray<Descendant>
  values: (
    ctx: DataProps<D, P, true> & { children: Children } & {
      sendToWebsocket: (value: WebSocketValue) => void
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
          sendToWebsocket?: (value: WebSocketValue) => void
        }) => unknown
      >
    | Record<string, unknown>
}

export type Sanitized<D extends object, P extends object> = Record<symbol, HtmlContent<D, P>[]>

export interface Scroll<D extends object, P> extends ScrollParams<D, P> {
export type ScrollAxis = 'vertical' | 'horizontal'

interface ScrollParams<D extends object, P> {
  unit: number
  elementMinSize: number
  axis: 'vertical' | 'horizontal' | (({ data }: { data: D }) => 'vertical' | 'horizontal')
  trigger?: ({ data }: { data: D }) => boolean
  parameter?: string
  rootMargin?: string | number
  buffer?: number
  throttle?: number
  method: (params: DataProps<D, P, true>) => void
}

export type SingleOrArray<T> = T | T[]

export type SSEMethod<D extends object, P> = (
  ctx: DataProps<D, P, true> & { event: MessageEvent; close: () => void }
) => void

export type Style<D extends object, P> =
  | StyleContent
  | ((dataProps: DataProps<D, P>) => StyleContent)

export interface StyleContent {
  [key: string]: string | number | undefined | StyleContent
}

export interface Task {
  instanceId: string
  func: () => void
  key: 'define' | 're-render' | 'fetch'
}

export type Translations = Record<string, unknown>

export interface WebSocketCtx<D extends object, P> extends DataProps<D, P, true> {
  websocket: {
    send: (value: WebSocketValue) => void
    readyState: () => number
    bufferedAmount: () => number
    binaryType: () => BinaryType
    url: () => string
    protocol: () => string
    extensions: () => string
  }
}

export interface WebSocketProp {
  send: (value: WebSocketValue) => void
  isOpened: () => boolean
}

export type WebSocketValue = string | Blob | ArrayBuffer | ArrayBufferView
