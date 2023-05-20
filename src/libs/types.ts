type Convert<T, D, P> = T | ((data: D, props: P) => T)

export type Css<D, P> =
  | (
      | string
      | {
          selector: string
          style: ({ data, props }: { data: D; props: P }) => {
            [key: string]: string | number
          }
        }
    )[]
  | string

interface Each<T> {
  contents: T[]
  render: (arg: T, index: number) => Html | undefined
}

interface EachIf<T> {
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
  method: (data: D, props: P, event: Event, index?: number) => void
}[]

export type Html = string | HTMLElement

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
  html: Convert<Html[] | Each<T> | EachIf<T> | If, D, P>
  css?: Css<D, P>
  slot?: string
  events?: Events<D, P>
}
