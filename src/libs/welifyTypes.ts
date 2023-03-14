export type Type<T> = T | (() => T)

export interface IfHtml {
  condition: Type<boolean> | unknown
  render: Type<string>
}

export interface Welify<T> {
  name: string
  className?: string
  html: Type<string> | Type<Array<T>> | Type<Array<IfHtml>>
  render?: Type<Array<IfHtml>> | ((arg: T) => string | undefined)
  fallback?: Type<string>
  css?: string
  slot?: string
  events?: { [key: string]: () => void }
}
