import type { DataProps, Query } from '../types'
import QueryCache from './cache'
import hash from './hash'

const syncQueryCache = <D extends object, P, T>({
  queryCache,
  getDataProps,
  options
}: { queryCache: QueryCache<T> } & Query.RuntimeCtx<D, P, T>): Query.Runtime | undefined => {
  if (!options) return undefined

  const subscriptions: Map<string, () => void> = new Map(),
    callbacks: Map<string, Query.Callback<D, P, T>> = new Map()

  const sync = (): void => {
    const _options: Query.Options<D, P, T>[] = options(getDataProps(true)),
      hashes: Set<string> = new Set()

    for (const { key, fetcher, onSuccess, onError, onFetching, enabled, ...args } of _options) {
      if (enabled === false) continue

      const hashed: string = hash(key)
      hashes.add(hashed)

      const entry: Query.Entry<T> = queryCache.ensure({ key, fetcher, config: args }),
        existing: Query.Callback<D, P, T> | undefined = callbacks.get(hashed)

      if (existing) {
        existing.onSuccess = onSuccess
        existing.onError = onError
        existing.onFetching = onFetching
        continue
      }

      const callback: Query.Callback<D, P, T> = { onSuccess, onError, onFetching }
      callbacks.set(hashed, callback)

      const call = (state: Query.State<T>, payload: DataProps.Payload<D, P, true>): void => {
          const { value, error, isFetching }: Query.State<T> = state

          if (isFetching && callback.onFetching) callback.onFetching(payload)
          if (value !== undefined && error === undefined) callback.onSuccess(payload, value)
          if (error && callback.onError) callback.onError(payload, error)
        },
        listener = (_: string, state: Query.State<T>): void => call(state, getDataProps(true))

      queryCache.subscribe({ hashed, listener })
      call(entry.state, getDataProps(true))

      if (queryCache.isStale(key)) void queryCache.fetch(key)

      subscriptions.set(hashed, () => queryCache.unsubscribe({ hashed, listener }))
    }

    for (const [hashed, unsubscribe] of subscriptions)
      if (!hashes.has(hashed)) {
        unsubscribe()
        subscriptions.delete(hashed)
        callbacks.delete(hashed)
      }
  }

  sync()

  return {
    sync,
    destroy: (): void => {
      for (const unsubscribe of subscriptions.values()) unsubscribe()
      subscriptions.clear()
      callbacks.clear()
    }
  }
}

export default syncQueryCache
