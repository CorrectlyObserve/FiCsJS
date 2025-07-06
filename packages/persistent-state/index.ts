import PersistentState from './state'

export default <S>(value: S, options?: { readonly: boolean }): PersistentState<S> =>
  new PersistentState(value, options)
