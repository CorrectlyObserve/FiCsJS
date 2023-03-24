type Convert<T, U> = T | ((data: Data<U>) => T)

export interface Data<U> {
  [key: string]: U
}

export type DelegatedEvents<U> = {
  selector: string
  [key: string]: string | EventListener<U>
}[]

export interface Each<T> {
  contents: T[]
  render: (arg: T) => string | undefined
}

export interface EachIf<T> {
  contents: T[]
  branches: {
    judge: (arg: T) => boolean
    render: (arg: T) => string
  }[]
  fallback?: (arg: T) => string
}

export type EventListener<T> = (data: Data<T>) => void

export interface Events<U> {
  [key: string]: EventListener<U>
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
  data?: Data<U>
  html: Convert<string | Each<T> | EachIf<T> | If, U>
  css?: string
  slot?: string
  events?: Events<U>
  delegatedEvents?: DelegatedEvents<U>
}
