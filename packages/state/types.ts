type Operation = 'read' | 'write' | 'remove'

export declare namespace Options {
  interface Global<S> {
    readonly?: boolean
    version?: number
    strictMode?: boolean
    sessionStorage?: string
    validate?: (value: unknown) => value is S
    onError?: (error: unknown, operation: Operation) => void
  }

  interface Local {
    readonly: boolean
    version: number
    strictMode: boolean
    sessionStorage?: string
    onError?: (error: unknown, operation: Operation) => void
  }
}
