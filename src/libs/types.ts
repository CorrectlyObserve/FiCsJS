interface Arg<T, D, P> {
  name: string
  className?: string
  html: Convert<Html | Each<T> | EachIf<T> | If, D, P>
  css?: (
    | string
    | {
        selector: string
        style: ({ data, props }: DataProps<D, P>) => {
          [key: string]: string | number
        }
      }
  )[]
  slot?: Convert<Html, D, P>
  events?: {
    handler: string
    selector?: string
    method: ({ data, props }: DataProps<D, P>, event: Event, index?: number) => void
  }[]
  inheritances?: {
    descendants: HTMLElement | HTMLElement[]
    props: (data: D) => P
  }[]
}

export interface Constructor<D> {
  new (...params: any[]): HTMLElement
  create: ({ data }: { data?: () => Partial<D> }) => HTMLElement
}

type Convert<T, D, P> = T | (({ data, props }: DataProps<D, P>) => T)

interface DataProps<D, P> {
  data: D
  props: P
}

export interface Define<T, D, P> extends Arg<T, D, P> {
  data?: () => D
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

export type Html = string | HTMLElement | DocumentFragment

export interface If {
  branches: {
    judge: boolean | unknown
    render: Html
  }[]
  fallback?: Html
}

export interface Initialize<T, D, P> extends Arg<T, D, P> {
  integratedData?: D
}
