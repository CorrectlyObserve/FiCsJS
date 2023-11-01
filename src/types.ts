import { WelyElement } from './class'

export type Css<D, P> = (
  | string
  | {
      selector: string
      style: ValueOrArrowFunc<D, P, Record<string, string | number>>
    }
)[]

export type Events<D, P> = {
  handler: string
  selector?: string
  method: ({ data, props }: { data: D; props: P }, event: Event, index?: number) => void
}[]

export type Html<D, P> = ValueOrArrowFunc<D, P, Record<symbol, (WelyElement<any, any> | string)[]>>

export type HtmlValue<D, P> = (WelyElement<D, P> | string)[]

export type Inheritances<D> = {
  descendants: WelyElement<any, any> | WelyElement<any, any>[]
  props: (data: D) => any
}[]

export interface PropsChain<P> {
  descendants: Set<string>
  chains: Record<string, P>
}

type ValueOrArrowFunc<D, P, T> = T | (({ data, props }: { data: D; props: P }) => T)

export interface Wely<D, P> {
  welyId?: string
  name: string
  className?: string
  inheritances?: Inheritances<D>
  data?: () => D
  isOnlyCsr?: boolean
  html: Html<D, P>
  css?: Css<D, P>
  ssrCss?: Css<D, P>
  slot?: Html<D, P>
  events?: Events<D, P>
}
