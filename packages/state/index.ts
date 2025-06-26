import State from './state'

const createState = <S>(value: S, options?: { readonly: boolean }): State<S> =>
  new State(value, options)

export default createState
