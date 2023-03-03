export type Branch<T> = T | string | (() => void)

export interface WelifyArgs {
  name: string
  html: () => string
  className?: string
  css?: string
  slot?: string
  events?: { [key: string]: () => void }
}

export interface welifyIfArgs {}

export interface welifyEachArgs {}
