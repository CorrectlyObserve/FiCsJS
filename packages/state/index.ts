import State from './state'

export default <S>(value: S, options?: { readonly: boolean }): State<S> => new State(value, options)
