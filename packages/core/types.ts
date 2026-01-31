import FiCsElement from './class'
import consts from './constants'

export type Actions<D extends object, P> = Record<
  string,
  Record<string, Method<D, P> | [Method<D, P>, ActionOptions]>
>

export interface ActionOptions {
  debounce?: number
  throttle?: number
  blur?: boolean
  once?: boolean
}

export type Attrs<D extends object, P> =
  | Record<string, string>
  | ((dataProps: DataProps<D, P>) => Record<string, string>)

export type Children = Record<string, Descendant>

export type ClassName<D extends object, P> = string | ((dataProps: DataProps<D, P>) => string)

export type Crud = {
  <T>(api: string, options?: CrudOptions): Promise<T>
  (api: string, options: CrudStreamOptions): Promise<void>
}

export interface CrudOptions extends RequestInit {
  key?: string
  timeout?: number
  maxRetry?: number
  delay?: number
}

export interface CrudStreamOptions extends CrudOptions {
  /**
    @remarks The chunk is NOT sanitized. Be cautious of XSS vulnerabilities.
  */
  onChunk: (chunk: string, index: number) => void
}

export type Css<D extends object, P> = CssContent<D, P> | GlobalCss

export interface CssContent<D extends object, P> {
  [key: string]: Style<D, P> | [Style<D, P>, 'csr' | 'ssr' | undefined]
}

export type DataProps<D extends object, P, B extends boolean = false> = {
  data: D
  props: P
} & (B extends true ? { crud: Crud } : {})

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
  actions?: Actions<D, P>
  options?: OptionParams<D, P>
}

export type GetDP<D extends object, P extends object> = <B extends boolean = false>(
  isCrud?: B
) => DataProps<D, P, B>

export type GlobalCss = GlobalCssContent | string

export interface GlobalCssContent {
  [key: string]: string | number | GlobalCssContent | [GlobalCssContent, 'csr' | 'ssr' | undefined]
}

export type Html<D extends object, P extends object> = (
  ctx: Omit<DataProps<D, P, true>, 'props' | 'getData'> &
    HtmlSyntaxes<D, P> & {
      isBrowser: boolean
      isDeferred: boolean
      scroll: <T>(
        array: T[],
        callback: (item: T, index: number) => Sanitized<D, P>
      ) => Sanitized<D, P>
    }
) => Sanitized<D, P>

export type HtmlContent<D extends object, P extends object> =
  | ([D, P] extends [object, object] ? Descendant : FiCsElement<D, P>)
  | string

export interface HtmlSyntaxes<D extends object, P extends object> {
  children: Children
  props: P
  template: (
    templates: TemplateStringsArray,
    ...variables: (HtmlContent<D, P> | unknown)[]
  ) => Sanitized<D, P>
  html: (str: string) => Record<symbol, string>
  show: (condition: boolean) => string
  apiStatuses: Record<string, boolean>
  attributes: {
    boolean: (condition: boolean | undefined) => 'true' | 'false'
    statusLiveRegion: typeof consts.a11y.STATUS_LIVE_REGION
  }
}

export interface HookParams<D extends object, P> extends DataProps<D, P, true> {
  ref: (selector: string) => Element | null
  debounce: <T extends (...args: any[]) => void>(
    func: T,
    time: number
  ) => (...args: Parameters<T>) => void
  throttle: <T extends (...args: any[]) => void>(
    func: T,
    time: number
  ) => (...args: Parameters<T>) => void
}

export interface Hooks<D extends object, P> {
  created?: (params: HookParams<D, P>) => void
  mounted?: (
    params: HookParams<D, P> & {
      poll: (func: ({ times }: { times: number }) => void, options: PollingOptions) => void
    }
  ) => void
  updated?: { [K in keyof D]?: (params: HookParams<D, P>) => void }
  destroyed?: (params: HookParams<D, P>) => void
  adopted?: (params: HookParams<D, P>) => void
}

export interface I18n {
  i18n: <T>({ lang, key }: { lang: string; key: SingleOrArray<string> }) => Promise<T>
}

export type Method<D extends object, P> = (
  params: DataProps<D, P, true> & {
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
    onopen?: (params: WebSocketParams<D, P> & { event: Event }) => void
    onmessage?: (params: WebSocketParams<D, P> & { event: MessageEvent }) => void
    onerror?: (params: WebSocketParams<D, P> & { event: Event }) => void
    onclose?: (params: WebSocketParams<D, P> & { event: CloseEvent }) => void
  }
  sse?: {
    path: string
    withCredentials?: boolean
    onopen?: (params: DataProps<D, P, true> & { event: Event; close: () => void }) => void
    onmessage?: SSEMethod<D, P>
    onerror?: (params: DataProps<D, P, true> & { event: Event; close: () => void }) => void
    actions: Record<string, SSEMethod<D, P> | [SSEMethod<D, P>, Omit<ActionOptions, 'blur'>]>
  }
  scroll?: Scroll<D, P>
}

export interface OptionParams<D extends object, P> extends Omit<Options<D, P>, 'ssr' | 'scroll'> {
  ssr?: boolean
  scroll?: ScrollParams<D, P>
}

export type PickedAttr = Pick<Attr, 'name' | 'value' | 'namespaceURI' | 'localName'>

export interface PollingOptions {
  interval: number
  max?: number
  exit?: () => boolean
}

export interface Props<D extends object, P> {
  descendant: (params: { children: Children }) => SingleOrArray<Descendant>
  values: (
    params: DataProps<D, P, true> & { children: Children } & {
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
  id: string
  start: number
  end: number
  isEnabled: boolean
  totalSize: number
  elementSizes: Map<string, number>
  prevTotalSize: number
  resizeObserver?: ResizeObserver
  intersectionObserver?: IntersectionObserver
  mutationObserver?: MutationObserver
}

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
  params: DataProps<D, P, true> & { event: MessageEvent; close: () => void }
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

export interface WebSocketParams<D extends object, P> extends DataProps<D, P, true> {
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
