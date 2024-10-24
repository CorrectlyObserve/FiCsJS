import FiCsElement from './class'

export interface Action<D, P> {
  handler: string
  selector?: string
  method: (params: MethodParams<D, P>) => void
  options?: { blur?: boolean; once?: boolean }
}

export type Attrs<D, P> =
  | Record<string, string>
  | ((params: DataProps<D, P>) => Record<string, string>)

export interface Bindings<D, P> {
  isClassName: boolean
  isAttr: boolean
  css: CssBinding
  actions: Action<D, P>[]
}

export type ClassName<D, P> = string | ((params: DataProps<D, P>) => string)

export type Css<D, P> = (string | CssContent<D, P> | GlobalCssContent)[]

type CssBinding = { index: number; nested?: CssBinding }[]

interface CssContent<D, P> extends CssSelector {
  style:
    | Record<string, string | number>
    | ((params: DataProps<D, P>) => Record<string, string | number>)
  nested?: CssContent<D, P>[]
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

export interface DataProps<D, P> {
  $data: D
  $props: P
}

export type Descendant = FiCsElement<any, any>

export interface FiCs<D extends object, P extends object> {
  name: string
  isExceptional?: boolean
  data?: () => D
  inheritances?: Inheritances<D, P>
  props?: P
  className?: ClassName<D, P>
  attributes?: Attrs<D, P>
  html: Html<D, P>
  css?: Css<D, P>
  actions?: Action<D, P>[]
  hooks?: Hooks<D, P>
  options?: Partial<Options>
}

export type GlobalCss = (GlobalCssContent | string)[]

interface GlobalCssContent extends CssSelector {
  style: Record<string, string | number | undefined>
  nested?: GlobalCssContent[]
}

export type Html<D extends object, P extends object> = (
  params: DataProps<D, P> & Syntaxes<D, P>
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

export type Inheritances<D, P> = {
  descendant: SingleOrArray<Descendant>
  props: (params: DataMethods<D> & { $props: P }) => object
}[]

export interface MethodParams<D, P> extends Params<D, P> {
  $event: Event
  $attributes: Record<string, string>
  $value?: string
}

export interface Options {
  immutable: boolean
  ssr: boolean
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
  process: () => void
}

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
