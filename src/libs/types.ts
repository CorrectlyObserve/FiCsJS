export type Branch<T> = T | string | (() => void)

export interface WelifyArg {
  name: string
  html: () => string
  className?: string
  css?: string
  events?: { [key: string]: () => void }
}
