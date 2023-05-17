export interface Args<D, P> {
  data: D
  props: P
}

type Convert<T, D, P> = T | ((data: D, props: P) => T)

export type Css<D, P> =
  | (
      | string
      | {
          selector: string
          style: ({ data, props }: Args<D, P>) => {
            [key: string]: string | number
          }
        }
    )[]
  | string

export type DelegatedEvents<D, P> = {
  selector: string
  [key: string]:
    | string
    | (({ data, props }: Args<D, P>, event: Event, index: number) => void)
}[]

interface Each<T> {
  contents: T[]
  render: (arg: T, index: number) => Html | undefined
  events?: {
    [key: string]: (arg: T) => void
  }
}

interface EachIf<T> {
  contents: T[]
  branches: {
    judge: (arg: T) => boolean
    render: (arg: T, index: number) => Html
  }[]
  fallback?: (arg: T, index: number) => Html
}

export interface Events<D, P> {
  [key: string]: ({ data, props }: Args<D, P>, event: Event) => void
}

export type Html = (string | HTMLElement)[]

interface If {
  branches: {
    judge: boolean | unknown
    render: Html
  }[]
  fallback?: Html
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
  html: Convert<Html | Each<T> | EachIf<T> | If, D, P>
  css?: Css<D, P>
  slot?: string
  events?: Events<D, P>
  delegatedEvents?: DelegatedEvents<D, P>
}
