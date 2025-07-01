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

export interface Bindings {
  isClassName: boolean
  isAttr: boolean
  css: number[]
}

export type Children = Record<string, Descendant>

export type ClassName<D, P> = string | ((dataProps: DataProps<D, P>) => string)

export interface CrudOptions<D> extends RequestInit {
  key?: keyof D
}

export type Css<D, P> =
  | string
  | { [key: string]: Style<D, P> | [Style<D, P>, 'csr' | 'ssr' | undefined] }
  | GlobalCssContent

export type DataProps<D, P, B extends boolean = false> = {
  data: D
  props: P
} & (B extends true ? { crud: { <T>(api: string, options?: CrudOptions<D>): Promise<T> } } : {})

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
  props?: SingleOrArray<Props<D, P>>
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  html: Html<D, P>
  css?: SingleOrArray<Exclude<Css<D, P>, GlobalCssContent>>
  clonedCss?: Css<D, P>[]
  hooks?: Hooks<D, P>
  actions?: Actions<D, P>
  options?: OptionParams
  scroll?: Omit<Scroll<D, P>, 'isEnabled'>
  sse?: ServerSentEvents<D, P>
}

export interface GlobalCssContent {
  [key: string]: string | number | GlobalCssContent | [GlobalCssContent, 'csr' | 'ssr' | undefined]
}

export type Html<D extends object, P extends object> = (
  params: DataPropsMethods<D, P> &
    Omit<Syntaxes<D, P>, 'props'> & { isBrowser: boolean; isDeferred: boolean }
) => Sanitized<D, P>

export type HtmlContent<D extends object, P extends object> =
  | ([D, P] extends [object, object] ? Descendant : FiCsElement<D, P>)
  | string

export interface Hooks<D, P> {
  created?: (params: DataPropsMethods<D, P, true>) => void
  mounted?: (params: DataPropsMethods<D, P, true> & Poll) => void
  updated?: {
    [K in keyof Partial<D>]: (params: {
      datum: D[K]
      setData: DataPropsMethods<D, P>['setData']
    }) => void
  }
  destroyed?: (params: DataPropsMethods<D, P, true>) => void
  adopted?: (params: DataPropsMethods<D, P, true>) => void
}

export type Method<D, P> = (
  params: DataPropsMethods<D, P, true> & {
    event: Event
    attributes: Record<string, string>
    value?: string
  }
) => void

export interface Options {
  ssr: boolean
  lazyLoad?: boolean
  rootMargin?: string
}

export type OptionParams = Omit<Options, 'ssr'> & { ssr?: boolean }

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
    | Record<string, ({ getData }: { getData: DataPropsMethods<D, P>['getData'] }) => any>
    | Record<string, any>
}

export interface PropsBinding {
  instanceId: string
  numberId: number
  propsKeys: Record<string, true>
  propsKey: string
  propsValue: () => unknown
  setProps: (value: unknown) => void
}

export type PropsChain<P> = Map<string, Record<string, P>>

export interface Queue {
  instanceId: string
  func: () => void
  key: 'define' | 're-render' | 'fetch'
}

export type Sanitized<D extends object, P extends object> = Record<symbol, HtmlContent<D, P>[]>

export interface Scroll<D, P> {
  isEnabled: boolean
  area: string
  rootMargin?: string
  trigger?: ({ data }: { data: D }) => boolean
  method: (params: DataPropsMethods<D, P, true>) => void
}

export interface ServerSentEvents<D, P> {
  path: string
  withCredentials?: boolean
  onopen?: (params: DataPropsMethods<D, P, true> & { event: Event }) => void
  onmessage?: (params: DataPropsMethods<D, P, true> & { event: MessageEvent }) => void
  onerror?: (params: DataPropsMethods<D, P, true> & { event: Event }) => void
  actions?: Record<string, SSEMethod<D, P> | [SSEMethod<D, P>, Omit<ActionOptions, 'blur'>]>
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
}
