import FiCsElement from './class'

export interface Action<D, P> {
  handler: string
  selector?: string
  method: Method<D, P>
  enterKey?: boolean
}

type ArrowFuncOrValue<V, D, P> = V | ((params: DataProps<D, P>) => V)

export type Attrs<D, P> = ArrowFuncOrValue<Record<string, string>, D, P>

export interface Bindings<D, P> {
  isClassName: boolean
  isAttr: boolean
  css: number[]
  actions: Action<D, P>[]
}

export type ClassName<D, P> = ArrowFuncOrValue<string, D, P>

export type Css<D, P> = (string | GlobalStyle | Style<D, P>)[]

export interface DataMethods<D> {
  $setData: (key: keyof D, value: D[typeof key]) => void
  $getData: (key: keyof D) => D[typeof key]
}

export interface DataProps<D, P> {
  $data: D
  $props: P
}

export type Descendant = FiCsElement<any, any>

export interface FiCs<D extends object, P extends object> {
  name: string
  isExceptional?: boolean
  isImmutable?: boolean
  data?: () => D
  inheritances?: Inheritances<D>
  props?: P
  isOnlyCsr?: boolean
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  html: Html<D, P>
  css?: Css<D, P>
  actions?: Action<D, P>[]
  hooks?: Hooks<D, P>
}

export type GlobalCss = (GlobalStyle | string)[]

export interface GlobalStyle {
  selector: SingleOrArray<string>
  style: Record<string, string | number>
}

export type Html<D extends object, P extends object> = (
  params: DataProps<D, P> & Syntax<D, P>
) => Sanitized<D, P>

export type HtmlContent<D extends object, P extends object> =
  | ([D, P] extends [object, object] ? Descendant : FiCsElement<D, P>)
  | string

export interface Hooks<D, P> {
  created?: (params: Params<D, P>) => void
  mounted?: (params: Params<D, P>) => void
  updated?: { [K in keyof Partial<D>]: (params: DataMethods<D> & { $dataValue?: D[K] }) => void }
  destroyed?: (params: Params<D, P>) => void
  adopted?: (params: Params<D, P>) => void
}

export type Inheritances<D> = {
  descendant: SingleOrArray<Descendant>
  props: (params: DataMethods<D>) => object
}[]

export interface I18n {
  json: Record<string, string>
  lang: string
  key: SingleOrArray<string>
}

export interface LangJson {
  langs: string[]
  directory: string
}

export type Method<D, P> = (params: MethodParams<D, P>) => void

export interface MethodParams<D, P> extends Params<D, P> {
  $event: Event
  $attributes: Record<string, string>
  $value?: string
}

export type Params<D, P> = DataProps<D, P> & DataMethods<D>

export type PropsChain<P> = Map<string, Record<string, P>>

export interface PropsTree<D, P> {
  numberId: number
  dataKey: keyof D
  setProps: (value: P[keyof P]) => void
}

export interface Queue {
  ficsId: string
  func: (css?: GlobalCss) => void
}

export type Sanitized<D extends object, P extends object> = Record<symbol, HtmlContent<D, P>[]>

export type SingleOrArray<T> = T | T[]

export interface Style<D, P> {
  selector?: SingleOrArray<string>
  style: ArrowFuncOrValue<Record<string, string | number>, D, P>
  csr?: boolean
  ssr?: boolean
}

export interface Syntax<D extends object, P extends object> {
  $template: (
    templates: TemplateStringsArray,
    ...variables: (HtmlContent<D, P> | unknown)[]
  ) => Sanitized<D, P>
  $html: (str: string) => Record<symbol, string>
  $show: (condition: boolean) => string
  $i18n: (params: I18n) => string
}
