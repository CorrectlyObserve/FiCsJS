import FiCsElement from './class'

export interface Action<D, P> {
  handler: string
  selector?: string
  method: (
    params: DataProps<D, P, true> & {
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
  css: { index: number; nested?: Bindings<D, P>['css'] }[]
  actions: Action<D, P>[]
}

export type ClassName<D, P> = string | ((dataProps: DataProps<D, P>) => string)

export type Css<D, P> = (string | CssContent<D, P> | GlobalCssContent)[]

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

export type DataProps<D, P, B = false> = { $data: D; $props: P } & (B extends true
  ? SetData<D>
  : {})

export type Descendant = FiCsElement<any, any>

export interface FiCs<D extends object, P extends object> {
  name: string
  isExceptional?: boolean
  data?: () => D
  fetch?: (dataProps: DataProps<D, P>) => Promise<Partial<D>>
  props?: SingleOrArray<Props<D, P>>
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  html: Html<D, P>
  css?: SingleOrArray<string | CssContent<D, P>>
  clonedCss?: Css<D, P>
  actions?: Action<D, P>[]
  hooks?: Hooks<D, P>
  options?: Options
}

export type GlobalCss = (GlobalCssContent | string)[]

export interface GlobalCssContent extends CssSelector {
  style: Record<string, string | number | undefined>
  nested?: SingleOrArray<GlobalCssContent>
}

export type Html<D extends object, P extends object> = (
  params: DataProps<D, P> & Omit<Syntaxes<D, P>, '$props'> & { $isLoaded?: boolean }
) => Sanitized<D, P>

export type HtmlContent<D extends object, P extends object> =
  | ([D, P] extends [object, object] ? Descendant : FiCsElement<D, P>)
  | string

export interface Hooks<D, P> {
  created?: (dataProps: DataProps<D, P, true>) => void
  mounted?: (dataProps: DataProps<D, P, true> & Poll) => void
  updated?: { [K in keyof Partial<D>]: (params: SetData<D> & { $datum?: D[K] }) => void }
  destroyed?: (dataProps: DataProps<D, P, true>) => void
  adopted?: (dataProps: DataProps<D, P, true>) => void
}

export interface Options {
  immutable?: boolean
  ssr?: boolean
  lazyLoad?: boolean
  rootMargin?: string
}

export interface Poll {
  $poll: (func: ({ $times }: { $times: number }) => void, options: PollingOptions) => void
}

export interface PollingOptions {
  interval: number
  max?: number
  exit?: () => boolean
}

export type Props<D, P> = {
  descendant: SingleOrArray<Descendant>
  values: SingleOrArray<{
    dataKey?: SingleOrArray<keyof D>
    key: string
    content: (
      dataProps: DataProps<D, P, true> & { $getData: <K extends keyof D>(key: K) => D[K] }
    ) => any
  }>
}

export type PropsChain<P> = Map<string, Record<string, P>>

export interface PropsTree<D> {
  numberId: number
  setProps: (key: keyof D) => void
}

export interface Queue {
  ficsId: string
  func: () => void
  key: 'define' | 're-render' | 'fetch'
}

export type Sanitized<D extends object, P extends object> = Record<symbol, HtmlContent<D, P>[]>

export interface SetData<D> {
  $setData: <K extends keyof D>(key: K, value: D[K]) => void
}

export type SingleOrArray<T = string> = T | T[]

export interface Syntaxes<D extends object, P extends object> {
  $props: P
  $template: (
    templates: TemplateStringsArray,
    ...variables: (HtmlContent<D, P> | unknown)[]
  ) => Sanitized<D, P>
  $html: (str: string) => Record<symbol, string>
  $show: (condition: boolean) => string
  $setProps: (descendant: Descendant, props: object) => Descendant
}
