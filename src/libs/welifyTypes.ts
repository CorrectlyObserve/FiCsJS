type Convert<T, U> = T | ((data: U) => T)

export type Css<U> = {
  selector: string
  style: (data: U) => {
    [key: string]: string | number
  }
}[]

export type DelegatedEvents<U> = {
  selector: string
  [key: string]: string | ((data: U, event: Event, index: number) => void)
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
  [key: string]: (data: U, event: Event) => void
}

export interface If {
  branches: {
    judge: boolean | unknown
    render: string
  }[]
  fallback?: string
}

export interface Welify<T, U> {
  name: string
  className?: string
  data?: U
  html: Convert<string | Each<T> | EachIf<T> | If, U>
  css?: string | Css<U>
  slot?: string
  events?: Events<U>
  delegatedEvents?: DelegatedEvents<U>
}
