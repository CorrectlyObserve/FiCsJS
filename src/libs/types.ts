interface CommonArgs<T, D, P> {
  name: string
  inheritances?: Inheritances<D, P>
  className?: string
  html: Convert<Html | Each<T> | EachIf<T> | If, D, P>
  css?: Css<D, P>
  slot?: Convert<string, D, P>
  events?: Events<D, P>
}

export interface Constructor<D> {
  new (...params: any[]): HTMLElement
  create: (data?: () => Partial<D>) => HTMLElement
}

type Convert<T, D, P> = T | (({ data, props }: { data: D; props: P }) => T)

export type Css<D, P> = (
  | string
  | {
      selector: string
      style: ({ data, props }: { data: D; props: P }) => {
        [key: string]: string | number
      }
    }
)[]

export interface Define<T, D, P> extends CommonArgs<T, D, P> {
  data?: () => D
}

export interface Each<T> {
  contents: T[]
  render: (arg: T, index: number) => string | HTMLElement | undefined
}

export interface EachIf<T> {
  contents: T[]
  branches: {
    judge: (arg: T) => boolean
    render: (arg: T, index: number) => string | HTMLElement
  }[]
  fallback?: (arg: T, index: number) => string | HTMLElement
}

export type Events<D, P> = {
  handler: string
  selector?: string
  method: (
    {
      data,
      props
    }: {
      data: D
      props: P
    },
    event: Event,
    index?: number
  ) => void
}[]

export type Html = string | HTMLElement | DocumentFragment

export interface If {
  branches: {
    judge: boolean | unknown
    render: string | HTMLElement
  }[]
  fallback?: string | HTMLElement
}

export type Inheritances<D, P> = {
  descendants: HTMLElement | HTMLElement[]
  props: (data: D) => P
  boundary?: string | HTMLElement
}[]

export interface Initialize<T, D, P> extends CommonArgs<T, D, P> {
  dataObj?: D
}
