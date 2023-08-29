import WelyClass from '@/class'

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
  | T
  | (({
      data,
      props,
      dependencies
    }: DataProps<D, P> & {
      dependencies?: WelyClass<T, D, P>[]
    }) => T)

export interface If {
  branches: {
    judge: boolean | unknown
    render: string
  }[]
  fallback?: string
}

export type Inheritances<D, P> = {
  descendants: HTMLElement | HTMLElement[]
  props: (data: D) => P
}[]

export type Slot<D, P> =
  | string
  | HTMLElement
  | (({ data, props }: DataProps<D, P>) => string | HTMLElement)

export interface Wely<T, D, P> {
  name: string
  className?: string
  dependencies?: WelyClass<T, D, P> | WelyClass<T, D, P>[]
  inheritances?: Inheritances<D, P>
  data?: () => D
  html: Html<string | Each<T> | EachIf<T> | If, D, P>
  css?: Css<D, P>
  slot?: Slot<D, P>
  events?: Events<D, P>
}
