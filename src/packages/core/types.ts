import WelyElement from './class'

type ArrowFuncOrValue<V, D, P> = V | (({ data, props }: { data: D; props: P }) => V)

export type Class<D, P> = ArrowFuncOrValue<string, D, P>

export type Css<D, P> = (
  | string
  | { selector: string; style: ArrowFuncOrValue<Record<string, string | number>, D, P> }
)[]

type Descendant = WelyElement<any, any>

export type Events<D, P> = {
  handler: string
  selector?: string
  method: Method<D, P>
}[]

export type Html<D, P> = ArrowFuncOrValue<Record<symbol, (Descendant | string)[]>, D, P>

export type Method<D, P> = (
  {
    data,
    setData,
    props
  }: {
    data: D
    setData: (key: keyof D, value: D[typeof key]) => void
    props: P
  },
  event: Event
) => void

export type Props<D> = {
  descendants: Descendant | Descendant[]
  values: (getData: (key: keyof D) => D[typeof key]) => any
}[]

export type PropsChain<P> = Map<string, Record<string, P>>

export type Reflections<D> = { [K in keyof Partial<D>]: (data: D[K]) => void }

export type Sanitized<D extends object, P extends object> = (WelyElement<D, P> | string)[]

export interface Wely<D, P> {
  name: string
  data?: () => D
  reflections?: Reflections<D>
  props?: Props<D>
  isOnlyCsr?: boolean
  className?: Class<D, P>
  html: Html<D, P>
  css?: Css<D, P>
  events?: Events<D, P>
}
