export interface Args<D, P> {
  data: D
  props: P
}

type Convert<T, D, P> = T | (({ data, props }: Args<D, P>) => T)

export type Css<D, P> = {
  selector: string
  style: ({ data, props }: Args<D, P>) => {
    [key: string]: string | number
  }
}[]

export type DelegatedEvents<D, P> = {
  selector: string
  [key: string]:
    | string
    | (({ data, props }: Args<D, P>, event: Event, index: number) => void)
}[]

export interface Each<T> {
  contents: T[]
  render: (arg: T, index: number) => string | undefined
  events?: {
    [key: string]: (arg: T) => void
  }
}

export interface EachIf<T> {
  contents: T[]
  branches: {
    judge: (arg: T) => boolean
    render: (arg: T, index: number) => string
  }[]
  fallback?: (arg: T, index: number) => string
}

export interface Events<D, P> {
  [key: string]: ({ data, props }: Args<D, P>, event: Event) => void
}

export interface If {
  branches: {
    judge: boolean | unknown
    render: string
  }[]
  fallback?: string
}

export type Inheritances<D, P> = {
  elements: HTMLElement[]
  props: (data: D) => P
}[]

export interface Welify<T, D, P> {
  name: string
  data?: D
  props?: P
  inheritances?: Inheritances<D, P>
  className?: string
  html: Convert<string | Each<T> | EachIf<T> | If, D, P>
  css?: string | Css<D, P>
  slot?: string
  events?: Events<D, P>
  delegatedEvents?: DelegatedEvents<D, P>
}
