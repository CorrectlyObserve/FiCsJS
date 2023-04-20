import { WelyElement } from './welyElement'

type Convert<T, U> = T | (({ data, props, state }: Values<U>) => T)

export type Css<U> = {
  selector: string
  style: ({ data, props, state }: Values<U>) => {
    [key: string]: string | number
  }
}[]

export type DelegatedEvents<U> = {
  selector: string
  [key: string]:
    | string
    | (({ data, props, state }: Values<U>, event: Event, index: number) => void)
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

export interface Events<U> {
  [key: string]: ({ data, props, state }: Values<U>, event: Event) => void
}

export interface If {
  branches: {
    judge: boolean | unknown
    render: string
  }[]
  fallback?: string
}

export type PropsStack<T> = { id: string; name: string; props: T }[]

export interface Values<U> {
  data: U
  props?: U
  state?: U
}

export interface Welify<T, U> {
  name: string
  descendants?: WelyElement<U>[]
  className?: string
  data?: U
  props?: U
  html: Convert<string | Each<T> | EachIf<T> | If, U>
  css?: string | Css<U>
  slot?: string | HTMLElement[]
  events?: Events<U>
  delegatedEvents?: DelegatedEvents<U>
}
