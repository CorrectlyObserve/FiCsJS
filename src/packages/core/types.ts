import FiCsElement from './class'

export interface Action<D, P> {
  handler: string
  selector?: string
  method: Method<D, P>
}

export interface Bindings {
  className: boolean
  html: boolean
  css: number[]
  actions: number[]
}

export type ClassName<D, P> = string | ((params: DataProps<D, P>) => string)

export type Css<D, P> = (string | Style<D, P>)[]

export interface DataProps<D, P> {
  data: D
  props: P
}

type Descendant = FiCsElement<any, any>

export interface FiCs<D extends object, P extends object> {
  ficsId?: string
  name: string
  isImmutable?: boolean
  data?: () => D
  reflections?: Reflections<D>
  inheritances?: Inheritances<D>
  props?: P
  isOnlyCsr?: boolean
  className?: ClassName<D, P>
  html: Html<D, P>
  css?: Css<D, P>
  actions?: Action<D, P>[]
  hooks?: Hooks<D, P>
}

export type Html<D extends object, P extends object> =
  | Symbolized<(Descendant | string)[]>
  | ((
      params: DataProps<D, P> & {
        template: (
          templates: TemplateStringsArray,
          ...variables: unknown[]
        ) => Symbolized<Sanitized<D, P>>
        html: (templates: TemplateStringsArray, ...variables: unknown[]) => Sanitized<D, P>
      }
    ) => Symbolized<(Descendant | string)[]>)

export interface Hooks<D, P> {
  connectedCallback?: HooksCallback<D, P>
  disconnectedCallback?: HooksCallback<D, P>
  adoptedCallback?: HooksCallback<D, P>
}

export type HooksCallback<D, P> = (
  params: DataProps<D, P> & { setData: (key: keyof D, value: D[typeof key]) => void }
) => void

export type Inheritances<D> = {
  descendants: Descendant | Descendant[]
  values: (getData: (key: keyof D) => D[typeof key]) => any
}[]

export type Method<D, P> = (
  params: DataProps<D, P> & { setData: (key: keyof D, value: D[typeof key]) => void; event: Event }
) => void

export type PropsChain<P> = Map<string, Record<string, P>>

export interface Queue {
  ficsId: string
  reRender: void
}

export type Reflections<D> = { [K in keyof Partial<D>]: (data: D[K]) => void }

export type Sanitized<D extends object, P extends object> = (FiCsElement<D, P> | string)[]

export interface Style<D, P> {
  selector?: string
  style:
    | Record<string, string | number>
    | ((params: DataProps<D, P>) => Record<string, string | number>)
}

export type Symbolized<V> = Record<symbol, V>
