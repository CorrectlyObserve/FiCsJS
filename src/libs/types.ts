export type Branch<T> = T | string | (() => void)

export interface WelyArgs {
  name: string
  parent: string
  html: string
  className?: string
  css?: string
  events?: { [key: string]: () => void }
}
