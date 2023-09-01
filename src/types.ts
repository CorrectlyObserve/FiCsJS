import { WelyClass } from '@/class'

export type Css<D, P> = (
  | string
  | {
      selector: string
      style: ({ data, props }: DataProps<D, P>) => Record<string, string | number>
    }
)[]

interface DataProps<D, P> {
  data: D
  props: P
}

export interface Each<T, D, P> {
  contents: T[]
  render: (arg: T, index: number) => WelyOrString<T, D, P> | undefined
}

export interface EachIf<T, D, P> {
  contents: T[]
  branches: {
    judge: (arg: T) => boolean
    render: (arg: T, index: number) => WelyOrString<T, D, P>
  }[]
  fallback?: (arg: T, index: number) => WelyOrString<T, D, P>
}

export type Events<D, P> = {
  handler: string
  selector?: string
  method: ({ data, props }: DataProps<D, P>, event: Event, index?: number) => void
}[]

export type Html<T, D, P> =
  | HtmlArg<T, D, P>
  | (({
      data,
      props,
      dependencies
    }: DataProps<D, P> & {
      dependencies?: WelyClass<T, D, P>[]
    }) => HtmlArg<T, D, P>)

type HtmlArg<T, D, P> = WelyOrString<T, D, P> | Each<T, D, P> | EachIf<T, D, P> | If<T, D, P>

export interface If<T, D, P> {
  branches: {
    judge: boolean | unknown
    render: WelyOrString<T, D, P>
  }[]
  fallback?: WelyOrString<T, D, P>
}

export type Inheritances<T, D, P> = {
  descendants: WelyClass<T, D | any, P> | WelyClass<T, D | any, P>[]
  props: (data: D) => P
}[]

export type Slot<T, D, P> =
  | WelyOrString<T, D, P>
  | (({ data, props }: DataProps<D, P>) => WelyOrString<T, D, P>)

export interface Wely<T, D, P> {
  name: string
  className?: string
  dependencies?: WelyClass<T, D | any, P> | WelyClass<T, D | any, P>[]
  inheritances?: Inheritances<T, D, P>
  data?: () => D
  html: Html<T, D, P>
  css?: Css<D, P>
  slot?: Slot<T, D, P>
  events?: Events<D, P>
}

type WelyOrString<T, D, P> =
  | WelyClass<T, D | any, P | any>
  | string
  | (WelyClass<T, D | any, P | any> | string)[]
