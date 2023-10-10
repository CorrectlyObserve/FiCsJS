import { WelyClass } from './class'

export type Css<D, P> = (
  | string
  | {
      selector: string
      style: ({ data, props }: { data: D; props: P }) => Record<string, string | number>
    }
)[]

export interface Each<T, D, P> {
  contents: T[]
  render: (arg: T, index: number) => Result<T, D, P> | undefined
}

export interface EachIf<T, D, P> {
  contents: T[]
  branches: {
    judge: (arg: T) => boolean
    render: (arg: T, index: number) => Result<T, D, P>
  }[]
  fallback?: (arg: T, index: number) => Result<T, D, P>
}

export type Events<D, P> = {
  handler: string
  selector?: string
  method: ({ data, props }: { data: D; props: P }, event: Event, index?: number) => void
}[]

export type Html<T, D, P> =
  | HtmlArg<T, D, P>
  | (({ data, props }: { data: D | any; props: P }) => HtmlArg<T, D, P>)

type HtmlArg<T, D, P> = Result<T, D, P> | Each<T, D, P> | EachIf<T, D, P> | If<T, D, P>

export interface If<T, D, P> {
  branches: {
    judge: boolean | unknown
    render: Result<T, D, P>
  }[]
  fallback?: Result<T, D, P>
}

export type Inheritances<T, D, P> = {
  descendants: SingleOrArray<WelyClass<T, D | any, P | any>>
  props: (data: D) => P | any
}[]

export interface PropsChain<P> {
  descendants: Set<string>
  chains: Record<string, P>
}

type Result<T, D, P> = SingleOrArray<WelyClass<T, D | any, P | any> | string>

export type SingleOrArray<T> = T | T[]

export type Slot<T, D, P> =
  | Result<T, D, P>
  | (({ data, props }: { data: D; props: P }) => Result<T, D, P>)

export interface Wely<T, D, P> {
  welyId?: string
  name: string
  className?: string
  inheritances?: Inheritances<T, D, P>
  data?: () => D
  html: Html<T, D, P>
  css?: Css<D, P>
  ssrCss?: Css<D, P>
  slot?: Slot<T, D, P>
  events?: Events<D, P>
}
