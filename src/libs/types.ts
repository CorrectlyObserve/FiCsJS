export interface CreateWely<T, D, P> {
  name: string
  className?: string
  dependencies?: Wely | Wely[]
  inheritances?: Inheritances<D, P>
  data?: () => D
  html: Html2<T, D, P>
  css?: Css<D, P>
  slot?: Slot<D, P>
  events?: Events<D, P>
}

export type Css<D, P> = (
  | string
  | {
      selector: string
      style: ({ data, props }: DataProps<D, P>) => {
        [key: string]: string | number
      }
    }
)[]

interface DataProps<D, P> {
  data: D
  props: P
}

export interface Each<T> {
  contents: T[]
  render: (arg: T, index: number) => Html | undefined
}

export interface EachIf<T> {
  contents: T[]
  branches: {
    judge: (arg: T) => boolean
    render: (arg: T, index: number) => Html
  }[]
  fallback?: (arg: T, index: number) => Html
}

export type Events<D, P> = {
  handler: string
  selector?: string
  method: ({ data, props }: DataProps<D, P>, event: Event, index?: number) => void
}[]

export type Html = string | HTMLElement | DocumentFragment | Wely

export type Html2<T, D, P> =
  | Html
  | Each<T>
  | EachIf<T>
  | If
  | (({
      data,
      props,
      dependencies
    }: DataProps<D, P> & {
      dependencies?: Wely[]
    }) => Html | Each<T> | EachIf<T> | If)

export interface If {
  branches: {
    judge: boolean | unknown
    render: Html
  }[]
  fallback?: Html
}

export type Inheritances<D, P> = {
  descendants: HTMLElement | HTMLElement[]
  props: (data: D) => P
}[]

export type Slot<D, P> =
  | string
  | HTMLElement
  | (({ data, props }: DataProps<D, P>) => string | HTMLElement)

export interface Wely {
  new (): HTMLElement
}
