import FiCsElement from './class'

export interface Action<D, P> {
  handler: string
  selector?: string
  method: (
    {
      data,
      setData,
      props
    }: {
      data: D
      setData: (key: keyof D, value: D[typeof key], bind?: string) => void
      props: P
    },
    event: Event
  ) => void
}

export type ClassName<D, P> = Value<string, D, P>

export type Css<D, P> = (
  | string
  | { selector?: string; style: Value<Record<string, string | number>, D, P> }
)[]

type Descendant = FiCsElement<any, any>

export interface FiCs<D, P> {
  name: string
  data?: () => D
  reflections?: Reflections<D>
  props?: Props<D>
  isOnlyCsr?: boolean
  className?: ClassName<D, P>
  html: Html<D, P>
  css?: Css<D, P>
  actions?: Action<D, P>[]
}

export type Html<D, P> = Value<Record<symbol, (Descendant | string)[]>, D, P>

export type Props<D> = {
  descendants: Descendant | Descendant[]
  values: (getData: (key: keyof D) => D[typeof key]) => any
}[]

export type PropsChain<P> = Map<string, Record<string, P>>

export interface Queue {
  ficsId: string
  reRender: void
}

export type Reflections<D> = { [K in keyof Partial<D>]: (data: D[K]) => void }

export type Sanitized<D extends object, P extends object> = (FiCsElement<D, P> | string)[]

export type Value<V, D, P> = V | (({ data, props }: { data: D; props: P }) => V)
