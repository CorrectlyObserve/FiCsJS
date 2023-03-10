interface commonArgs {
  name: string
  className?: string
  css?: string
  slot?: string
  events?: { [key: string]: () => void }
}

interface normalArgs extends commonArgs {
  syntax?: undefined
  html: string | (() => string)
}

interface ifArgs extends commonArgs {
  syntax: 'if'
  branches: () => Array<{
    condition: boolean | (() => boolean) | unknown
    html: string | (() => string)
  }>
  fallback?: string | (() => string)
}

interface eachArgs<T> extends commonArgs {
  syntax: 'each'
  html: Array<T> | (() => Array<T>)
  mount: (arg: T) => string
}

export type WelifyArgs<T> = normalArgs | ifArgs | eachArgs<T>
