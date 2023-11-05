import { WelyElement } from './class'

export type Css<D, P> = (
  | string
  | {
      selector: string
      style:
        | Record<string, string | number>
        | (({ data, props }: { data: D; props: P }) => Record<string, string | number>)
    }
)[]

export type Events<D, P> = {
  handler: string
  selector?: string
  method: ({ data, props }: { data: D; props: P }, event: Event, index?: number) => void
}[]

export type Html<D, P> =
  | Record<symbol, (WelyElement<any, any> | string)[]>
  | (({ data, props }: { data: D; props: P }) => Record<symbol, (WelyElement<any, any> | string)[]>)

export type Props<D> = {
  descendants: WelyElement<any, any> | WelyElement<any, any>[]
  values: (data: D) => any
}[]

export interface PropsChain<P> {
  descendants: Set<string>
  chains: Record<string, P>
}

export type Slot<D, P> = { name: string; values: Html<D, P> }[]

export interface Wely<D, P> {
  welyId?: string
  name: string
  className?: string
  data?: () => D
  props?: Props<D>
  isOnlyCsr?: boolean
  html: Html<D, P>
  css?: Css<D, P>
  ssrCss?: Css<D, P>
  slot?: Html<D, P> | Slot<D, P>
  events?: Events<D, P>
}
