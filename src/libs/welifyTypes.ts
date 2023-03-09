interface commonArgs {
  name: string
  className?: string
  css?: string
  events?: { [key: string]: () => void }
}

interface normalArgs extends commonArgs {
  syntax?: undefined
  html: () => string
  slot?: string
}

interface ifArgs extends commonArgs {
  syntax: 'if'
  html: () => string
}

interface eachArgs<T> extends commonArgs {
  syntax: 'each'
  html: Array<T>
  display: (arg: T) => string
}

export type WelifyArgs<T> = normalArgs | ifArgs | eachArgs<T>
