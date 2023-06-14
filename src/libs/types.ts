interface Arg<D, P> {
  data: D
  props: P
}

type Convert<T, D, P> = T | (({ data, props }: Arg<D, P>) => T)

export type Css<D, P> = (
  | string
  | {
      selector: string
      style: ({ data, props }: Arg<D, P>) => {
        [key: string]: string | number
      }
    }
)[]

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
  method: ({ data, props }: Arg<D, P>, event: Event, index?: number) => void
}[]

export type Html = string | HTMLElement

export interface If {
  branches: {
    judge: boolean | unknown
    render: Html
  }[]
  fallback?: Html
}

export type Inheritances<D, P> = {
  elements: HTMLElement | HTMLElement[]
  props: (data: D) => P
}[]

export interface WelyConstructor<D, P> {
  new (...params: any[]): HTMLElement
  create: ({ data, props }: { data?: Partial<D>; props?: Partial<P> }) => HTMLElement
}

export interface Welify<T, D, P> {
  name: string
  data?: D
  props?: P
  inheritances?: Inheritances<D, P>
  className?: string
  html: Convert<Html | Html[] | Each<T> | EachIf<T> | If, D, P>
  css?: Css<D, P>
  slot?: Convert<string, D, P>
  events?: Events<D, P>
}
