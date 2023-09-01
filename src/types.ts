import { Class } from '@/class'

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
  render: (arg: T, index: number) => OrString<T, D, P> | undefined
}

export interface EachIf<T, D, P> {
  contents: T[]
  branches: {
    judge: (arg: T) => boolean
    render: (arg: T, index: number) => OrString<T, D, P>
  }[]
  fallback?: (arg: T, index: number) => OrString<T, D, P>
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
      dependencies?: Class<T, D, P>[]
    }) => HtmlArg<T, D, P>)

type HtmlArg<T, D, P> = OrString<T, D, P> | Each<T, D, P> | EachIf<T, D, P> | If<T, D, P>

export interface If<T, D, P> {
  branches: {
    judge: boolean | unknown
    render: OrString<T, D, P>
  }[]
  fallback?: OrString<T, D, P>
}

export type Inheritances<T, D, P> = {
  descendants: Class<T, D | any, P> | Class<T, D | any, P>[]
  props: (data: D) => P
}[]

export type Slot<T, D, P> =
  | OrString<T, D, P>
  | (({ data, props }: DataProps<D, P>) => OrString<T, D, P>)

export interface <T, D, P> {
  name: string
  className?: string
  dependencies?: Class<T, D | any, P> | Class<T, D | any, P>[]
  inheritances?: Inheritances<T, D, P>
  data?: () => D
  html: Html<T, D, P>
  css?: Css<D, P>
  slot?: Slot<T, D, P>
  events?: Events<D, P>
}

type OrString<T, D, P> =
  | Class<T, D | any, P>
  | string
  | (Class<T, D | any, P> | string)[]
