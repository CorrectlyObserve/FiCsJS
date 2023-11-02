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

type Descendant = WelyElement<any, any>

export type Events<D, P> = {
  handler: string
  selector?: string
  method: ({ data, props }: { data: D; props: P }, event: Event, index?: number) => void
}[]

export type Html<D, P> =
  | Record<symbol, (Descendant | string)[]>
  | (({ data, props }: { data: D; props: P }) => Record<symbol, (Descendant | string)[]>)

export type Props<D> = {
  descendants: Descendant | Descendant[]
  values: (data: D) => any
}[]

export interface PropsChain<P> {
  descendants: Set<string>
  chains: Record<string, P>
}

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
  slot?: Html<D, P>
  events?: Events<D, P>
}
