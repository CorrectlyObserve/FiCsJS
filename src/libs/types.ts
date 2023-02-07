export type Branch<T> = T | string | (() => void)

export interface Args {
  name: string
  parent: string
  html: string
  css: string
  events: { [key: string]: () => void }
}
