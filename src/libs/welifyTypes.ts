export type Type<T> = T | (() => T)

export interface IfHtml {
  judge: Type<boolean> | unknown
  render: Type<string>
}

export interface Welify<T> {
  name: string
  className?: string
  html: Type<string> | Type<T[]> | Type<IfHtml[]>
  render?: Type<IfHtml[]> | ((arg: T) => string | undefined)
  fallback?: Type<string>
  css?: string
  slot?: string
  events?: { [key: string]: () => void }
}
