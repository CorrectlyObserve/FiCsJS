import { WelyElement } from './class'

export type Class<D, P> = string | (({ data, props }: DataProps<D, P>) => string)

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

export type Descendant = Record<symbol, (DescendantElement | string)[]>

type DescendantElement = WelyElement<any, any>

export type Events<D, P> = {
  handler: string
  selector?: string
  method: ({ data, props }: DataProps<D, P>, event: Event) => void
}[]

export type Html<D, P> = Descendant | (({ data, props }: DataProps<D, P>) => Descendant)

export type Props<D> = {
  descendants: DescendantElement | DescendantElement[]
  values: (data: D) => any
}[]

export interface PropsChain<P> {
  descendants: Set<string>
  chains: Record<string, P>
}

export type Sanitized<D, P> = (WelyElement<D, P> | string)[]

export interface Wely<D, P> {
  welyId?: string
  name: string
  data?: () => D
  props?: Props<D>
  isOnlyCsr?: boolean
  className?: Class<D, P>
  html: Html<D, P>
  slot?: Html<D, P> | (Html<D, P> | { name: string; contents: Html<D, P> })[]
  css?: Css<D, P>
  ssrCss?: Css<D, P>
  events?: Events<D, P>
}
