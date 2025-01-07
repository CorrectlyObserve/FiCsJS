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

export type ClassName<D, P> = string | ((dataProps: DataProps<D, P>) => string)

export type Css<D, P> =
  | string
  | { [key: string]: Style<D, P> | [Style<D, P>, 'csr' | 'ssr' | undefined] }
  | GlobalCssContent

export type DataProps<D, P> = {
  data: D
  props: P
}

export type DataPropsMethods<D, P> = {
  data: D
  props: P
  setData: <K extends keyof D>(key: K, value: D[K]) => void
  getData: <K extends keyof D>(key: K) => D[K]
}

export type Descendant = FiCsElement<any, any>

export interface FiCs<D extends object, P extends object> {
  name: string
  isExceptional: boolean
  data?: () => Partial<D>
  fetch?: (dataProps: DataProps<D, P>) => Promise<Partial<D>>
  props?: Props<D, P>[]
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  html: Html<D, P>
  css?: SingleOrArray<Exclude<Css<D, P>, GlobalCssContent>>
  clonedCss?: Css<D, P>[]
  actions?: Actions<D, P>
  hooks?: Hooks<D, P>
  options?: Options
}

export interface GlobalCssContent {
  [key: string]: string | number | GlobalCssContent | [GlobalCssContent, 'csr' | 'ssr' | undefined]
}

export type Html<D extends object, P extends object> = (
  params: DataPropsMethods<D, P> & Omit<Syntaxes<D, P>, 'props'> & { isLoaded?: boolean }
) => Sanitized<D, P>

export type HtmlContent<D extends object, P extends object> =
  | ([D, P] extends [object, object] ? Descendant : FiCsElement<D, P>)
  | string

export interface Hooks<D, P> {
  created?: (params: DataPropsMethods<D, P>) => void
  mounted?: (params: DataPropsMethods<D, P> & Poll) => void
  updated?: {
    [K in keyof Partial<D>]: (params: {
      datum: D[K]
      setData: DataPropsMethods<D, P>['setData']
    }) => void
  }
  destroyed?: (params: DataPropsMethods<D, P>) => void
  adopted?: (params: DataPropsMethods<D, P>) => void
}

export type Method<D, P> = (
  params: DataPropsMethods<D, P> & {
    event: Event
    attributes: Record<string, string>
    value?: string
  }
) => void

export interface Options {
  ssr?: boolean
  lazyLoad?: boolean
  rootMargin?: string
}

export interface Poll {
  poll: (func: ({ times }: { times: number }) => void, options: PollingOptions) => void
}

export interface PollingOptions {
  interval: number
  max?: number
  exit?: () => boolean
}

export interface Props<D, P> {
  descendant: SingleOrArray<Descendant>
  values: (
    params: Omit<DataPropsMethods<D, P>, 'getData'>
  ) =>
    | Record<string, ({ getData }: { getData: DataPropsMethods<D, P>['getData'] }) => any>
    | Record<string, any>
}

export type PropsChain<P> = Map<string, Record<string, P>>

export interface PropsTree {
  numberId: number
  keys: Record<string, true>
  setProps: () => void
}

export interface Queue {
  ficsId: string
  func: () => void
  key: 'define' | 're-render' | 'fetch'
}

export type Sanitized<D extends object, P extends object> = Record<symbol, HtmlContent<D, P>[]>

export type SingleOrArray<T> = T | T[]

export type Style<D, P> = StyleContent | ((dataProps: DataProps<D, P>) => StyleContent)

interface StyleContent {
  [key: string]: string | number | undefined | StyleContent
}

export interface Syntaxes<D extends object, P extends object> {
  props: P
  template: (
    templates: TemplateStringsArray,
    ...variables: (HtmlContent<D, P> | unknown)[]
  ) => Sanitized<D, P>
  html: (str: string) => Record<symbol, string>
  show: (condition: boolean) => string
  setProps: (descendant: Descendant, props: object) => Descendant
}
