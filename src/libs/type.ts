export type Branch = string | (() => void)

export interface WelyArgs {
  name: string
  parent: string
  html: string
  css: string
  events: { [key: string]: () => void }
}