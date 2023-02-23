export type Branch<T> = T | string | (() => void)

export interface WelifyArgs {
  name: string
  html: () => string
  className?: string
  css?: string
  events?: { [key: string]: () => void }
}

export interface welifyIfArgs {}

export interface welifyEachArgs {}

export interface welifySlotArgs {
  slotId?: string
  html: () => string
  css?: string
}
