export interface Snapshot {
  id: number
  state: unknown
  name: string
  createdAt: number
  updatedAt: number
}

export interface State {
  id: number
  state: unknown
  key: string
  readonly: boolean
  createdAt: number
  updatedAt: number
}
