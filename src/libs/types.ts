interface CommonArgs<T, D, P> {
  name: string
  inheritances?: Inheritances<D, P>
  className?: string
  html: Convert<Html | Each<T> | EachIf<T> | If, D, P>
  css?: Css<D, P>
  slot?: Convert<StringOrElement, D, P>
  events?: Events<D, P>
}

export interface Constructor<D> {
  new (...params: any[]): HTMLElement
  create: (data?: () => Partial<D>) => HTMLElement
}

type Convert<T, D, P> = T | (({ data, props }: { data: D; props: P }) => T)

type Css<D, P> = (
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
  render: (arg: T, index: number) => StringOrElement | undefined
}

export interface EachIf<T> {
  contents: T[]
  branches: {
    judge: (arg: T) => boolean
    render: (arg: T, index: number) => StringOrElement
  }[]
  fallback?: (arg: T, index: number) => StringOrElement
}

type Events<D, P> = {
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
    render: StringOrElement
  }[]
  fallback?: StringOrElement
}

type Inheritances<D, P> = {
  descendants: HTMLElement | HTMLElement[]
  props: (data: D) => P
  boundary?: StringOrElement
}[]

export interface Initialize<T, D, P> extends CommonArgs<T, D, P> {
  dataObj?: D
}

type StringOrElement = string | HTMLElement
