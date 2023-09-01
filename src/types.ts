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

export interface Each<T> {
  contents: T[]
  render: (arg: T, index: number) => string | undefined
}

export interface EachIf<T> {
  contents: T[]
  branches: {
    judge: (arg: T) => boolean
    render: (arg: T, index: number) => string
  }[]
  fallback?: (arg: T, index: number) => string
}

export type Events<D, P> = {
  handler: string
  selector?: string
  method: ({ data, props }: DataProps<D, P>, event: Event, index?: number) => void
}[]

export type Html<T, D, P> =
  | ReturnValue<T, D, P>
  | Each<T>
  | EachIf<T>
  | If
  | (({
      data,
      props,
      dependencies
    }: DataProps<D, P> & {
      dependencies?: WelyClass<T, D, P>[]
    }) => ReturnValue<T, D, P> | Each<T> | EachIf<T> | If)

export interface If {
  branches: {
    judge: boolean | unknown
    render: string
  }[]
  fallback?: string
}

export type Inheritances<T, D, P> = {
  descendants: WelyClass<T, D | any, P> | WelyClass<T, D | any, P>[]
  props: (data: D) => P
}[]

type ReturnValue<T, D, P> = string | WelyClass<T, D | any, P> | DocumentFragment

export type Slot<T, D, P> =
  | ReturnValue<T, D, P>
  | (({ data, props }: DataProps<D, P>) => ReturnValue<T, D, P>)

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
