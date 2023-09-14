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
  | (({
      data,
      props,
      dependencies
    }: {
      data: D | any
      props: P
      dependencies?: WelyClass<T, D, P>[]
    }) => HtmlArg<T, D, P>)

export interface PropsChain<P> {
  components: Set<string>
  chain: Record<string, P>
}

type HtmlArg<T, D, P> = Result<T, D, P> | Each<T, D, P> | EachIf<T, D, P> | If<T, D, P>

export interface If<T, D, P> {
  branches: {
    judge: boolean | unknown
    render: Result<T, D, P>
  }[]
  fallback?: Result<T, D, P>
}

export type Inheritances<T, D, P> = {
  descendants: SingleOrArray<WelyClass<T, D | any, P>>
  props: (data: D) => P
}[]

type Result<T, D, P> = SingleOrArray<WelyClass<T, D | any, P> | string>

export type SingleOrArray<T> = T | T[]

export type Slot<T, D, P> =
  | Result<T, D, P>
  | (({ data, props }: { data: D; props: P }) => Result<T, D, P>)

export interface Wely<T, D, P> {
  welyId?: string
  name: string
  className?: string
  dependencies?: SingleOrArray<WelyClass<T, D | any, P>>
  inheritances?: Inheritances<T, D, P>
  data?: () => D
  html: Html<T, D, P>
  css?: Css<D, P>
  slot?: Slot<T, D, P>
  events?: Events<D, P>
}
