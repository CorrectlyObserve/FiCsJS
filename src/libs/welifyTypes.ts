interface Common {
  name: string
  className?: string
  css?: string
  slot?: string
  events?: { [key: string]: () => void }
}

interface Normal extends Common {
  syntax?: undefined
  html: string | (() => string)
}

interface If extends Common {
  syntax: 'if'
  branches: () => Array<{
    condition: boolean | (() => boolean) | unknown
    html: string | (() => string)
  }>
  fallback?: string | (() => string)
}

interface Each<T> extends Common {
  syntax: 'each'
  html: Array<T> | (() => Array<T>)
  mount: (arg: T) => string
}

export type Welify<T> = Normal | If | Each<T>
