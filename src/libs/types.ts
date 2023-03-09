export type Branch<T> = T | string | (() => void)

interface commonArgs {
  name: string
  className?: string
  css?: string
  slot?: string
  events?: { [key: string]: () => void }
}

interface normalArgs extends commonArgs {
  html: () => string
  syntax?: undefined
}

interface ifArgs extends commonArgs {
  html: () => string
  syntax: 'if'
}

interface eachArgs<T> extends commonArgs {
  html: Array<T>
  display: (arg: T) => string
  syntax: 'each'
}

export type WelifyArgs<T> = normalArgs | ifArgs | eachArgs<T>
