type Operation = 'read' | 'write' | 'remove'

export interface Options<S> {
  version?: number
  readonly?: boolean
  strictMode?: boolean
  onError?: (error: unknown, operation: Operation) => void
  session?: {
    key: string
    validate?: (value: unknown) => value is S
  }
}
