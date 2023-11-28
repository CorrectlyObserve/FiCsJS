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
  method: (
    {
      data,
      setData,
      props
    }: { data: D; setData: (key: keyof D, value: D[typeof key]) => void; props: P },
    event: Event
  ) => void
}[]

export type Html<D, P> = ArrowFuncOrValue<Record<symbol, (Descendant | string)[]>, D, P>

export type Props<D> = {
  descendants: Descendant | Descendant[]
  values: (
    data: D,
    getData?: (key: keyof D) => Record<typeof key, D[typeof key]>
  ) => any
}[]

export interface PropsChain<P> {
  descendants: Set<string>
  chains: Record<string, P>
  map: Map<string, string>
}

export type Reflections<D> = { [K in keyof Partial<D>]: (data: D[K]) => void }

export type Sanitized<D extends object, P extends object> = (WelyElement<D, P> | string)[]

export type Slot<D, P> = (Html<D, P> | { name: string; contents: Html<D, P> })[]

export interface Wely<D, P> {
  welyId?: string
  name: string
  data?: () => D
  props?: Props<D>
  isOnlyCsr?: boolean
  className?: Class<D, P>
  html: Html<D, P>
  slot?: Html<D, P> | Slot<D, P>
  css?: Css<D, P>
  events?: Events<D, P>
  reflections?: Reflections<D>
}
