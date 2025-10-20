import FiCsElement from './class'

export type Actions<D, P> = Record<
  string,
  Record<string, Method<D, P> | [Method<D, P>, ActionOptions]>
>

export interface ActionOptions {
  debounce?: number
  throttle?: number
  blur?: boolean
  once?: boolean
}

export type Attrs<D, P> =
  | Record<string, string>
  | ((dataProps: DataProps<D, P>) => Record<string, string>)

export type Children = Record<string, Descendant>

export type ClassName<D, P> = string | ((dataProps: DataProps<D, P>) => string)

export interface CrudOptions extends RequestInit {
  key?: string
  delay?: number
}

export type Css<D, P> = CssContent<D, P> | GlobalCss

export interface CssContent<D, P> {
  [key: string]: Style<D, P> | [Style<D, P>, 'csr' | 'ssr' | undefined]
}

export type DataProps<D, P, B extends boolean = false> = {
  data: D
  props: P
} & (B extends true ? { crud: { <T>(api: string, options?: CrudOptions): Promise<T> } } : {})

export type DataPropsMethods<D, P, B extends boolean = false> = DataProps<D, P, B> & {
  setData: <K extends keyof D>(key: K, value: D[K]) => void
  getData: <K extends keyof D>(key: K) => D[K]
}

export type Descendant = FiCsElement<any, any>

export type Excluded = 'isExceptional' | 'instanceId' | 'componentId' | 'clonedCss'

export interface FiCs<D extends object, P extends object> {
  name: string
  isExceptional?: boolean
  instanceId?: string
  componentId?: string
  children?: Descendant[]
  data?: () => Partial<D>
  deferredData?: (params: DataProps<D, P, true>) => Promise<Partial<D>>
  i18nData?: (params: DataProps<D, P, false> & I18n) => Promise<Partial<D>>
  props?: SingleOrArray<Props<D, P>>
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  html: Html<D, P>
  css?: SingleOrArray<CssContent<D, P> | string>
  clonedCss?: Css<D, P>[]
  hooks?: Hooks<D, P>
  actions?: Actions<D, P>
  options?: OptionParams<D, P>
  scroll?: ScrollParams<D, P>
}

export type GlobalCss = GlobalCssContent | string

export interface GlobalCssContent {
  [key: string]: string | number | GlobalCssContent | [GlobalCssContent, 'csr' | 'ssr' | undefined]
}

export type Html<D extends object, P extends object> = (
  params: Omit<DataPropsMethods<D, P>, 'props' | 'getData'> &
    Syntaxes<D, P> & {
      isBrowser: boolean
      isDeferred: boolean
      virtualScroll: <T>(
        array: T[],
        callback: (item: T, index: number) => Sanitized<D, P>
      ) => Sanitized<D, P>
    }
) => Sanitized<D, P>

export type HtmlContent<D extends object, P extends object> =
  | ([D, P] extends [object, object] ? Descendant : FiCsElement<D, P>)
  | string

export interface Hooks<D, P> {
  created?: (params: DataPropsMethods<D, P, true>) => void
  mounted?: (params: DataPropsMethods<D, P, true> & Poll) => void
  updated?: { [K in keyof D]?: (params: DataPropsMethods<D, P, true>) => void }
  propsUpdated?: { [K in keyof P]?: (params: DataPropsMethods<D, P, true>) => void }
  destroyed?: (params: DataPropsMethods<D, P, true>) => void
  adopted?: (params: DataPropsMethods<D, P, true>) => void
}

export interface I18n {
  i18n: <T>({ lang, key }: { lang: string; key: SingleOrArray<string> }) => Promise<T>
}

export type Method<D, P> = (
  params: DataPropsMethods<D, P, true> & {
    event: Event
    attributes: Record<string, string>
    value?: string
  }
) => void

export interface Options<D, P> {
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
    onopen?: (params: DataPropsMethods<D, P, true> & { event: Event }) => void
    onmessage?: SSEMethod<D, P>
    onerror?: (params: DataPropsMethods<D, P, true> & { event: Event }) => void
    actions: Record<string, SSEMethod<D, P> | [SSEMethod<D, P>, Omit<ActionOptions, 'blur'>]>
  }
}

export type OptionParams<D, P> = Omit<Options<D, P>, 'ssr'> & { ssr?: boolean }

interface Poll {
  poll: (func: ({ times }: { times: number }) => void, options: PollingOptions) => void
}

export interface PollingOptions {
  interval: number
  max?: number
  exit?: () => boolean
}

export interface Props<D, P> {
  descendant: (params: { children: Children }) => SingleOrArray<Descendant>
  values: (
    params: Omit<DataPropsMethods<D, P, true>, 'getData'>
  ) =>
    | Record<
        string,
        ({
          getData,
          sendToWebsocket
        }: {
          getData: DataPropsMethods<D, P>['getData']
          sendToWebsocket?: (value: WebSocketValue) => void
        }) => unknown
      >
    | Record<string, unknown>
}

export interface PropsBinding {
  instanceId: string
  numberId: number
  propsKeys: Record<string, true>
  propsKey: string
  propsValue: () => unknown
  setProps: (value: unknown) => void
}

export type PropsChain<P> = Map<string, Partial<P>>

export type Sanitized<D extends object, P extends object> = Record<symbol, HtmlContent<D, P>[]>

export interface Scroll<D, P> extends ScrollParams<D, P> {
  id: string
  start: number
  end: number
  isEnabled: boolean
  totalHeight: number
  elementHeights: Map<string, number>
  prevTotalHeight: number
  resizeObserver?: ResizeObserver
  intersectionObserver?: IntersectionObserver
  mutationObserver?: MutationObserver
}

interface ScrollParams<D, P> {
  unit: number
  elementMinHeight: number
  trigger?: ({ data }: { data: D }) => boolean
  rootMargin?: string
  buffer?: number
  throttle?: number
  method: (params: DataPropsMethods<D, P, true>) => void
}

export type SingleOrArray<T> = T | T[]

export type SSEMethod<D, P> = (
  params: DataPropsMethods<D, P, true> & { event: MessageEvent }
) => void

export type Style<D, P> = StyleContent | ((dataProps: DataProps<D, P>) => StyleContent)

interface StyleContent {
  [key: string]: string | number | undefined | StyleContent
}

export interface Syntaxes<D extends object, P extends object> {
  children: Children
  props: P
  template: (
    templates: TemplateStringsArray,
    ...variables: (HtmlContent<D, P> | unknown)[]
  ) => Sanitized<D, P>
  html: (str: string) => Record<symbol, string>
  show: (condition: boolean) => string
  apiStatuses: Record<string, boolean>
}

export interface Task {
  instanceId: string
  func: () => void
  key: 'define' | 're-render' | 'fetch'
}

export type Translations = Record<string, unknown>

export interface WebSocketParams<D, P> extends DataPropsMethods<D, P, true> {
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
