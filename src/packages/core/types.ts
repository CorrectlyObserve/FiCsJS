import FiCsElement from './class'

export interface Action<D, P> {
  handler: string
  selector?: string
  method: Method<D, P>
  enterKey?: boolean
}

type ArrowFuncOrValue<V, D, P> = V | ((params: DataProps<D, P>) => V)

export type Attrs<D, P> = ArrowFuncOrValue<Record<string, string>, D, P>

export interface Bindings {
  isClassName: boolean
  isAttr: boolean
  css: number[]
  actions: number[]
}

export type ClassName<D, P> = ArrowFuncOrValue<string, D, P>

export type Css<D, P> = (string | Style<D, P>)[]

export interface DataProps<D, P> {
  $data: D
  $props: P
}

type Descendant = FiCsElement<any, any>

export interface FiCs<D extends object, P extends object> {
  name: string
  isExceptional?: boolean
  ficsId?: string
  isImmutable?: boolean
  data?: () => D
  reflections?: Reflections<D>
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

export type Html<D extends object, P extends object> = (
  params: DataProps<D, P> & {
    $template: Sanitize<D, P>
    $html: (str: string) => Record<symbol, string>
    $show: (condition: boolean) => string
    $i18n: ({ json, lang, keys }: I18n) => string
  }
) => Sanitized<D, P>

export type HtmlContents<D extends object = any, P extends object = any> = (
  | ([D, P] extends [any, any] ? Descendant : FiCsElement<D, P>)
  | string
)[]

export interface Hooks<D, P> {
  connect?: HookContent<D, P>
  disconnect?: HookContent<D, P>
  adopt?: HookContent<D, P>
}

type HookContent<D, P> = (params: Param<D, P>) => void

export type Inheritances<D> = {
  descendants: Descendant | Descendant[]
  values: (getData: (key: keyof D) => D[typeof key]) => any
}[]

export interface I18n {
  json: Record<string, string>
  lang: string
  keys: string | string[]
}

export type Method<D, P> = (params: Param<D, P> & { $event: Event }) => void

export type Param<D, P> = DataProps<D, P> & {
  $setData: (key: keyof D, value: D[typeof key]) => void
}

export type PropsChain<P> = Map<string, Record<string, P>>

export interface PropsTree<D, P> {
  numberId: number
  dataKey: keyof D
  setProps: (value: P[keyof P]) => void
}

export interface Queue {
  ficsId: string
  reRender: void
}

export type Reflections<D> = { [K in keyof Partial<D>]: (data: D[K]) => void }

export type Sanitize<D extends object, P extends object> = (
  templates: TemplateStringsArray,
  ...variables: unknown[]
) => Sanitized<D, P>

export type Sanitized<D extends object, P extends object> = Record<symbol, HtmlContents<D, P>>

export interface Style<D, P> {
  selector?: string
  style: ArrowFuncOrValue<Record<string, string | number>, D, P>
}