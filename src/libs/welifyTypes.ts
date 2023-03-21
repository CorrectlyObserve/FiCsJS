type Convert<T, U> = T | ((data: Data<U>) => T)

export interface Data<U> {
  [key: string]: U
}

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

export interface Event<U> {
  [key: string]: (data: Data<U>) => void
}

type EventArray<U> = {
  selector: string
  listener: string
  function: (data: Data<U>) => void
}[]

export type Events<U> = Event<U> | EventArray<U>

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
}
