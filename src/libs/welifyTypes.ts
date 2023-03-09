interface commonArgs {
  name: string
  className?: string
  css?: string
  slot?: string
  events?: { [key: string]: () => void }
}

interface normalArgs extends commonArgs {
  syntax?: undefined
  html: () => string
}

interface ifArgs extends commonArgs {
  syntax: 'if'
  if: boolean | (() => boolean)
  html: () => string
  else?: () => string
}

interface eachArgs<T> extends commonArgs {
  syntax: 'each'
  html: () => Array<T>
  display: (arg: T) => string
}

export type WelifyArgs<T> = normalArgs | ifArgs | eachArgs<T>
