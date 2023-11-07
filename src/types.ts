import { WelyElement } from './class'

export type ClassName<D, P> = string | (({ data, props }: DataProps<D, P>) => string)

export type Css<D, P> = (
  | string
  | {
      selector: string
      style:
        | Record<string, string | number>
        | (({ data, props }: DataProps<D, P>) => Record<string, string | number>)
    }
)[]

interface DataProps<D, P> {
  data: D
  props: P
}

export type Events<D, P> = {
  handler: string
  selector?: string
  method: ({ data, props }: DataProps<D, P>, event: Event, index?: number) => void
}[]

export type Html<D, P> =
  | Record<symbol, (WelyElement<any, any> | string)[]>
  | (({ data, props }: DataProps<D, P>) => Record<symbol, (WelyElement<any, any> | string)[]>)

export interface NamedSlot<D, P> {
  name: string
  values: Html<D, P>
}

export type Props<D> = {
  descendants: WelyElement<any, any> | WelyElement<any, any>[]
  values: (data: D) => any
}[]

export interface PropsChain<P> {
  descendants: Set<string>
  chains: Record<string, P>
}

export interface Wely<D, P> {
  welyId?: string
  name: string
  data?: () => D
  props?: Props<D>
  isOnlyCsr?: boolean
  className?: ClassName<D, P>
  html: Html<D, P>
  css?: Css<D, P>
  ssrCss?: Css<D, P>
  slot?: Html<D, P> | (Html<D, P> | NamedSlot<D, P>)[]
  events?: Events<D, P>
}
