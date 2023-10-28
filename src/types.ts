import { WelyElement } from './class'

export type Css<D, P> = (
  | string
  | {
      selector: string
      style: ({ data, props }: { data: D; props: P }) => Record<string, string | number>
    }
)[]

export interface Each<T> {
  contents: T[]
  render: (arg: T, index: number) => Result<T> | undefined
}

export interface EachIf<T> {
  contents: T[]
  branches: {
    judge: (arg: T) => boolean
    render: (arg: T, index: number) => Result<T>
  }[]
  fallback?: (arg: T, index: number) => Result<T>
}

export interface EventHandler<D, P> {
  handler: string
  selector?: string
  method: ({ data, props }: { data: D; props: P }, event: Event, index?: number) => void
}

export type Html<T, D, P> =
  | HtmlValue<T>
  | (({ data, props }: { data: D; props: P }) => HtmlValue<T>)

export type HtmlOrSlot<T, D, P> = Html<T, D, P> | Slot<T, D, P> extends Html<T, D, P>
  ? HtmlValue<T>
  : WelyElement<T, D, P> | string

export type HtmlSymbol<T, D, P> = Record<symbol, SanitizedHtml<T, D, P>>

type HtmlValue<T> = Record<symbol, Result<T>> | Each<T> | EachIf<T> | If<T>

export interface If<T> {
  branches: {
    judge: boolean | unknown
    render: Result<T>
  }[]
  fallback?: Result<T>
}

export type Inheritances<T, D> = {
  descendants: SingleOrArray<WelyElement<T, any, any>>
  props: (data: D) => any
}[]

export interface PropsChain<P> {
  descendants: Set<string>
  chains: Record<string, P>
}

type Result<T> = SingleOrArray<WelyElement<T, any, any> | string>

export type SanitizedHtml<T, D, P> = (WelyElement<T, D, P> | string)[]

type SingleOrArray<T> = T | T[]

export type Slot<T, D, P> =
  | Record<symbol, Result<T>>
  | (({ data, props }: { data: D; props: P }) => Record<symbol, Result<T>>)

export interface Wely<T, D, P> {
  welyId?: string
  name: string
  className?: string
  inheritances?: Inheritances<T, D>
  data?: () => D
  isOnlyCsr?: boolean
  html: Html<T, D, P>
  css?: Css<D, P>
  ssrCss?: Css<D, P>
  csrSlot?: Slot<T, D, P>
  events?: EventHandler<D, P>[]
}
