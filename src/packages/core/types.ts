import FiCsElement from './class'

export interface Action<D, P> {
  handler: string
  selector?: string
  method: Method<D, P>
}

export type ClassName<D, P> = string | (({ data, props }: { data: D; props: P }) => string)

export type Css<D, P> = (
  | string
  | {
      selector?: string
      style:
        | Record<string, string | number>
        | (({ data, props }: { data: D; props: P }) => Record<string, string | number>)
    }
)[]

type Descendant = FiCsElement<any, any>

export interface FiCs<D extends object, P extends object> {
  ficsId?: string
  name: string
  data?: () => D
  reflections?: Reflections<D>
  inheritances?: Inheritances<D>
  props?: P
  isOnlyCsr?: boolean
  className?: ClassName<D, P>
  html: Html<D, P>
  css?: Css<D, P>
  actions?: Action<D, P>[]
}

export interface FiCsIframe<D, P> {
  props?: P
  isOnlyCsr?: boolean
  className?: ClassName<D, P>
  css?: Css<D, P>
}

export type Html<D extends object, P extends object> =
  | Record<symbol, (Descendant | string)[]>
  | ((args: {
      data: D
      props: P
      template: (
        templates: TemplateStringsArray,
        ...variables: unknown[]
      ) => Record<symbol, Sanitized<D, P>>
      html: (content: string) => string
    }) => Record<symbol, (Descendant | string)[]>)

export type Inheritances<D> = {
  descendants: Descendant | Descendant[]
  values: (getData: (key: keyof D) => D[typeof key]) => any
}[]

export type Method<D, P> = ({
  data,
  props,
  setData,
  event
}: {
  data: D
  props: P
  setData: (key: keyof D, value: D[typeof key], bind?: string) => void
  event: Event
}) => void

export type PropsChain<P> = Map<string, Record<string, P>>

export interface Queue {
  ficsId: string
  reRender: void
}

export type Reflections<D> = { [K in keyof Partial<D>]: (data: D[K]) => void }

export type Sanitized<D extends object, P extends object> = (FiCsElement<D, P> | string)[]
