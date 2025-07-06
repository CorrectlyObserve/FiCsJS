export interface Snapshot<S> extends State<S> {
  readonly: true
}

export interface State<S> {
  id?: number
  key: string
  state: S
  readonly: boolean
  createdAt: number
  updatedAt: number
}
