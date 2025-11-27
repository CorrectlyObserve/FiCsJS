export interface Backoff {
  maxRetry: number
  interval: number
  multiplier: number
  maxDelay: number
  jitter: number
}

export interface Snapshot<S> extends State<S> {
  snapshotId: string
  readonly: true
}

export interface State<S> {
  id?: number
  stateId: string
  state: S
  readonly: boolean
  createdAt: number
  updatedAt: number
}
