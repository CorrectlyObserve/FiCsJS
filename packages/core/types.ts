import FiCsElement from './class'

export interface Action<D, P> {
  handler: string
  selector?: string
  method: (
    methodParams: DataParams<D, P> & {
      $event: Event
      $attributes: Record<string, string>
      $value?: string
    }
  ) => void
  options?: { debounce?: number; throttle?: number; blur?: boolean; once?: boolean }
}

export type Attrs<D, P> =
  | Record<string, string>
  | ((dataProps: DataProps<D, P>) => Record<string, string>)

export interface Bindings<D, P> {
  isClassName: boolean
  isAttr: boolean
  css: CssBinding
  actions: Action<D, P>[]
}

export type ClassName<D, P> = string | ((dataProps: DataProps<D, P>) => string)

export type Css<D, P> = (string | CssContent<D, P> | GlobalCssContent)[]

type CssBinding = { index: number; nested?: CssBinding }[]

export interface CssContent<D, P> extends CssSelector {
  style:
    | Record<string, string | number>
    | ((dataProps: DataProps<D, P>) => Record<string, string | number | never>)
  nested?: SingleOrArray<CssContent<D, P>>
}

interface CssSelector {
  selector?: SingleOrArray
  csr?: boolean
  ssr?: boolean
}

export interface DataMethods<D> {
  $setData: (key: keyof D, value: D[typeof key]) => void
  $getData: (key: keyof D) => D[typeof key]
}

export type DataParams<D, P> = DataProps<D, P> & DataMethods<D>

export interface DataProps<D, P> {
  $data: D
  $props: P
}

export type Descendant = FiCsElement<any, any>

export interface FiCs<D extends object, P extends object> {
  name: string
  isExceptional?: boolean
  data?: () => D
  props?: SingleOrArray<Props<D, P>>
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  html: Html<D, P>
  css?: SingleOrArray<string | CssContent<D, P>>
  actions?: Action<D, P>[]
  hooks?: Hooks<D, P>
  options?: Partial<Options>
}

export interface FiCsAwait {
  fetch: Promise<FiCsAwaitedData['response']>
  awaited: (
    syntaxes: Syntaxes<FiCsAwaitedData, {}> & { $response: FiCsAwaitedData['response'] }
  ) => ResultContent<FiCsAwaitedData>
  fallback?: (syntaxes: Syntaxes<FiCsAwaitedData, {}>) => ResultContent<FiCsAwaitedData>
  props?: SingleOrArray<Props<FiCsAwaitedData, {}>>
  className?: ClassName<FiCsAwaitedData, {}>
  attributes?: Attrs<FiCsAwaitedData, {}>
  css?: SingleOrArray<string | CssContent<FiCsAwaitedData, {}>>
  actions?: Action<FiCsAwaitedData, {}>[]
  hooks?: Hooks<FiCsAwaitedData, {}>
  options?: Omit<Options, 'immutable'>
}

export interface FiCsAwaitedData {
  isLoaded: boolean
  response: unknown
}

export type GlobalCss = (GlobalCssContent | string)[]

export interface GlobalCssContent extends CssSelector {
  style: Record<string, string | number | undefined>
  nested?: SingleOrArray<GlobalCssContent>
}

export type Html<D extends object, P extends object> = (
  params: DataProps<D, P> & Syntaxes<D, P>
) => Sanitized<D, P>

export type HtmlContent<D extends object, P extends object> =
  | ([D, P] extends [object, object] ? Descendant : FiCsElement<D, P>)
  | string

export interface Hooks<D, P> {
  created?: (dataParams: DataParams<D, P>) => void
  mounted?: (dataParams: DataParams<D, P>) => void
  updated?: { [K in keyof Partial<D>]: (params: DataMethods<D> & { $dataValue?: D[K] }) => void }
  destroyed?: (dataParams: DataParams<D, P>) => void
  adopted?: (dataParams: DataParams<D, P>) => void
}

export interface Options {
  immutable: boolean
  ssr: boolean
  lazyLoad: boolean
  rootMargin: string
}

export type Props<D, P> = {
  descendant: SingleOrArray<Descendant>
  values: (params: DataMethods<D> & { $props: P }) => Record<string, any>
}

export type PropsChain<P> = Map<string, Record<string, P>>

export interface PropsTree<D, P> {
  numberId: number
  dataKey: keyof D
  setProps: (value: P[keyof P]) => void
}

export interface Queue {
  ficsId: string
  func: () => void
  key: 'define' | 'init' | 're-render'
}

export type ResultContent<D extends object> = Descendant | Sanitized<D, {}>

export type Sanitized<D extends object, P extends object> = Record<symbol, HtmlContent<D, P>[]>

export type SingleOrArray<T = string> = T | T[]

export interface Syntaxes<D extends object, P extends object> {
  $template: (
    templates: TemplateStringsArray,
    ...variables: (HtmlContent<D, P> | unknown)[]
  ) => Sanitized<D, P>
  $html: (str: string) => Record<symbol, string>
  $show: (condition: boolean) => string
}
