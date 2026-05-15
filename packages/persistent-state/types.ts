export interface Ctx<S> {
  stateId: string
  state: S
  options?: {
    readonly?: boolean
    intervalMs?: number
    maxRetries?: number
    forcedUpgrade?: boolean
  }
}

export type Metric =
  | { type: 'init'; stateId: string; durationMs: number; attempt: number; error?: unknown }
  | { type: 'get' | 'set' | 'delete'; stateId: string; durationMs: number; error?: unknown }
  | {
      type: 'snapshot:save' | 'snapshot:get' | 'snapshot:delete'
      stateId: string
      durationMs: number
      snapshotId: string
      error?: unknown
    }
  | {
      type: 'snapshot:get-all'
      stateId: string
      durationMs: number
      snapshotCount: number
      error?: unknown
    }

export interface Options {
  readonly?: boolean
  strictMode?: boolean
  forcedUpgrade?: boolean
  intervalMs?: number
  maxRetries?: number
}

export interface QueryOptions {
  snapshotId?: string
  isOnlyKey?: boolean
  isAllSnapshots?: boolean
}

export interface Snapshot<S> extends State<S> {
  snapshotId: string
}

export interface State<S> {
  id?: number
  stateId: string
  state: S
  createdAt: number
  updatedAt: number
}

export type SyncPayload<S> =
  | { type: 'set'; state: S; timestamp: number }
  | { type: 'delete'; timestamp: number }
