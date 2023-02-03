export type Branch = string | (() => void)

export interface Args {
  name: string
  parent: string
  html: string
  css: string
  events: { [key: string]: () => void }
}