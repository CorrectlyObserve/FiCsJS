export type Branch<T> = T | string | (() => void)

export interface Args {
  name: string
  html: () => string
  className?: string
  css?: string
  events?: { [key: string]: () => void }
}

export interface IfArgs {}

export interface EachArgs {}

export interface SlotArgs {
  slotId?: string
  content: string
  css?: string
}
