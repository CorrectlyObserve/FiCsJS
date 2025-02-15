export interface Snapshot<S> {
  id: number
  state: S
  name: string
  createdAt: number
  updatedAt: number
}

export interface State<S> {
  id: string
  state: S
  readonly: boolean
  createdAt: number
  updatedAt: number
}
