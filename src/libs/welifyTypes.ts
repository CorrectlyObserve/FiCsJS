export interface Each<T> {
  contents: Type<T[]>
  render: (arg: T) => string | undefined
}

export interface EachIf<T> {
  contents: Type<T[]>
  branches: Type<
    {
      judge: (arg: T) => boolean
      render: (arg: T) => string
    }[]
  >
  fallback?: (arg: T) => string
}

export interface If {
  branches: Type<
    {
      judge: Type<boolean> | unknown
      render: Type<string>
    }[]
  >
  fallback?: Type<string>
}

export type Type<T> = T | (() => T)

export interface Welify<T> {
  name: string
  className?: string
  html: Type<string | Each<T> | EachIf<T> | If>
  css?: string
  slot?: string
  events?: { [key: string]: () => void }
}
