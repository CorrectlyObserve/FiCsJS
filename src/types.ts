import WelyElement from './class'

type ArrowFuncOrValue<T, D, P> = T | (({ data, props }: { data: D; props: P }) => T)

export type Class<D, P> = ArrowFuncOrValue<string, D, P>

export type Css<D, P> = (
  | string
  | { selector: string; style: ArrowFuncOrValue<Record<string, string | number>, D, P> }
)[]

export type Effects<D> = { [T in keyof D]: (data: D[T]) => void }

export type Events<D, P> = {
  handler: string
  selector?: string
  method: (
    {
      data,
      setData,
      props
    }: { data: D; setData: (key: keyof D, value: D[keyof D]) => void; props: P },
    event: Event
  ) => void
}[]

export type Html<D, P> = ArrowFuncOrValue<Record<symbol, (WelyElement<any, any> | string)[]>, D, P>

export type Props<D> = {
  descendants: WelyElement<any, any> | WelyElement<any, any>[]
  values: (data: D) => any
}[]

export interface PropsChain<P> {
  descendants: Set<string>
  chains: Record<string, P>
}

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
  reflections?: () => Effects<D>
}
