import {
  delay,
  getDelayMs,
  isBrowser,
  isObject,
  MAX_DELAY_MS,
  MAX_RETRIES,
  NOOP,
  numberError,
  shouldRetry,
  typedEntries,
  watch
} from '../helpers'
import type { Query } from '../types'
import { constants } from './constants'
import { hash } from './hash'

export class QueryCache {
  readonly #entries: Map<string, Query.Entry> = new Map()
  readonly #listeners: Map<string, Set<Query.Listener>> = new Map()
  readonly #config: Query.Config.Global
  readonly #onOnline?: () => void
  readonly #onChangeVisibility?: () => void
  #isDestroyed: boolean = false
  #api?: Query.Api

  constructor(config?: Partial<Query.Config.Global>) {
    this.#config = {
      staleMs: constants.STALE_MS,
      gcLimitMs: constants.GC_LIMIT_MS,
      maxDelayMs: MAX_DELAY_MS,
      maxRetries: MAX_RETRIES,
      refetchIntervalMs: 0,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      ...config
    }

    const { staleMs, gcLimitMs, maxDelayMs, maxRetries, refetchIntervalMs }: Query.Config.Global =
      this.#config

    numberError(
      { staleMs, gcLimitMs, maxDelayMs, maxRetries, refetchIntervalMs },
      'non-negative-int'
    )

    if (isBrowser()) {
      this.#onOnline = () => this.#refresh(this.#config.refetchOnReconnect)
      this.#onChangeVisibility = () => {
        if (document.visibilityState === 'visible') this.#refresh(this.#config.refetchOnFocus)
      }

      window.addEventListener('online', this.#onOnline)
      window.addEventListener('visibilitychange', this.#onChangeVisibility)
    }
  }

  #subscriberCount(hashed: string): number {
    return this.#listeners.get(hashed)?.size ?? 0
  }

  #isRefetchable(entry: Query.Entry): boolean {
    return this.#subscriberCount(entry.hashed) > 0 && !entry.isOptimistic
  }

  #refresh(isEnabled: boolean): void {
    if (!isEnabled) return

    for (const entry of this.#entries.values())
      if (this.#isRefetchable(entry) && this.isStale(entry.key)) void this.fetch(entry.key)
  }

  #dispatchState(entry: Query.Entry, partial: Partial<Query.State>): void {
    entry.state = { ...entry.state, ...partial }

    const { hashed, state, key }: Query.Entry = entry,
      listeners: Set<Query.Listener> | undefined = this.#listeners.get(hashed)

    if (!listeners) return

    for (const listener of listeners)
      try {
        listener(hashed, state)
      } catch (error) {
        this.#config.onError?.(key, error)
      }
  }

  #getEntry(key: Query.Key): Query.Entry {
    return this.#entries.get(hash(key)) ?? this.ensure({ key })
  }

  #unscheduleGc(entry: Query.Entry): void {
    if (entry.gcTimer) {
      clearTimeout(entry.gcTimer)
      entry.gcTimer = undefined
    }
  }

  #emitMetric(event: Query.Metric.Payload): void {
    if (!this.#config.onMetric) return

    try {
      this.#config.onMetric({ module: 'query-cache', ...event })
    } catch (error) {
      console.error(
        `The onMetric callback in QueryCache failed during the '${event.type}' event...`,
        error
      )
    }
  }

  #scheduleGc(entry: Query.Entry): void {
    this.#unscheduleGc(entry)

    entry.gcTimer = setTimeout(() => {
      if (this.#subscriberCount(entry.hashed) === 0 && !entry.isOptimistic) {
        entry.abort?.abort()

        if (entry.refetchTimer) clearInterval(entry.refetchTimer)

        this.#entries.delete(entry.hashed)
        this.#listeners.delete(entry.hashed)

        this.#emitMetric({ type: 'cache:evict', key: entry.key, reason: 'gc' })
      }
    }, this.#config.gcLimitMs)
  }

  #applyRefetchTimer(entry: Query.Entry): void {
    if (entry.refetchTimer) {
      clearInterval(entry.refetchTimer)
      entry.refetchTimer = undefined
    }

    if (entry.refetchIntervalMs > 0 && this.#subscriberCount(entry.hashed) > 0)
      entry.refetchTimer = setInterval(() => {
        if (this.#isRefetchable(entry)) void this.fetch(entry.key)
      }, entry.refetchIntervalMs)
  }

  #partialMatch(key: Query.Key, partial: Query.Key): boolean {
    const { length }: { length: number } = partial
    if (length === 0) return true

    if (length > key.length) return false

    for (let i = 0; i < length; i++) {
      const k: unknown = key[i],
        p: unknown = partial[i]

      if (k === p) continue
      if (!isObject(k) || !isObject(p) || hash([k]) !== hash([p])) return false
    }

    return true
  }

  #match(filter?: Query.Filter): Query.Entry[] {
    const entries: Query.Entry[] = [...this.#entries.values()]

    if (!filter) return entries

    return entries.filter(entry => {
      const isKeyMatch: boolean = filter.key
        ? filter.isExactlyMatched
          ? hash(entry.key) === hash(filter.key)
          : this.#partialMatch(entry.key, filter.key)
        : true

      if (!isKeyMatch || (filter.predicate && !filter.predicate(entry))) return false

      return true
    })
  }

  #endOptimisticUpdate({ entry, result, attempt, startedAt }: Query.EndOptimisticUpdate): void {
    entry.isOptimistic = false
    this.#emitMetric({
      type: 'optimistic:end',
      key: entry.key,
      result,
      attempt,
      durationMs: performance.now() - startedAt
    })

    const isFetchable: boolean = this.#subscriberCount(entry.hashed) > 0 && !!entry.fetcher,
      isRefetchNeeded: boolean = result === 'reverted' || entry.state.updatedAt === 0

    if (isFetchable && isRefetchNeeded) void this.fetch(entry.key)
  }

  /** @param config Must be non-negative integers. */
  ensure({ key, fetcher, config }: Query.Ensure): Query.Entry {
    const hashed: string = hash(key),
      existing: Query.Entry | undefined = this.#entries.get(hashed)

    numberError({ ...config }, 'non-negative-int')

    if (existing) {
      if (fetcher) existing.fetcher = fetcher

      const prevIntervalMs: number = existing.refetchIntervalMs

      for (const [key, value] of typedEntries({ ...config }))
        if (value !== undefined) existing[key] = value

      if (existing.refetchIntervalMs !== prevIntervalMs) this.#applyRefetchTimer(existing)
      return existing
    }

    const { staleMs, maxRetries, refetchIntervalMs }: Query.Config.Entry = config ?? {},
      entry: Query.Entry = {
        key,
        hashed,
        state: { isFetching: false, updatedAt: 0 },
        fetcher: fetcher ?? null,
        staleMs: staleMs ?? this.#config.staleMs,
        maxDelayMs: this.#config.maxDelayMs,
        maxRetries: maxRetries ?? this.#config.maxRetries,
        refetchIntervalMs: refetchIntervalMs ?? this.#config.refetchIntervalMs,
        inflight: null,
        abort: null,
        isOptimistic: false,
        fetchId: 0
      }

    this.#entries.set(hashed, entry)
    return entry
  }

  isStale(key: Query.Key): boolean {
    const entry: Query.Entry | undefined = this.#entries.get(hash(key))
    if (!entry) return true

    const { state, staleMs }: Query.Entry = entry

    if (state.updatedAt === 0) return true
    return Date.now() - state.updatedAt > staleMs
  }

  async fetch(key: Query.Key): Promise<void> {
    const entry: Query.Entry | undefined = this.#entries.get(hash(key))
    if (!entry || !entry.fetcher || entry.isOptimistic) return

    if (entry.inflight) return entry.inflight

    entry.abort?.abort()
    entry.abort = new AbortController()

    const { signal }: { signal: AbortSignal } = entry.abort,
      fetchId: number = ++entry.fetchId,
      isCurrentFetch = (): boolean => entry.fetchId === fetchId

    if (!isCurrentFetch()) return
    this.#dispatchState(entry, { isFetching: true })

    const promise: Promise<void> = (async () => {
      let attempt: number = 1

      while (true) {
        if (!isCurrentFetch()) return

        const startedAt: number = performance.now()
        this.#emitMetric({ type: 'fetch:start', key: entry.key, attempt })

        try {
          const value: unknown = await entry.fetcher!({ key: entry.key, signal })

          if (!isCurrentFetch()) return

          this.#dispatchState(entry, {
            value,
            error: undefined,
            isFetching: false,
            updatedAt: Date.now()
          })

          this.#emitMetric({
            type: 'fetch:success',
            key: entry.key,
            attempt,
            durationMs: performance.now() - startedAt
          })
          this.#emitMetric({ type: 'cache:update', key: entry.key, source: 'fetch' })

          return
        } catch (error) {
          if (!isCurrentFetch()) return

          const willRetry: boolean = shouldRetry({
            error,
            attempt,
            maxRetries: entry.maxRetries,
            signal
          })

          this.#emitMetric({
            type: 'fetch:error',
            key: entry.key,
            attempt,
            durationMs: performance.now() - startedAt,
            error,
            willRetry
          })

          if (!willRetry) {
            if (!isCurrentFetch()) return
            this.#dispatchState(entry, { error, isFetching: false })
            this.#config.onError?.(entry.key, error)
            return
          }

          try {
            await delay(getDelayMs({ error, attempt, maxDelayMs: entry.maxDelayMs }), signal)
          } catch {
            return
          } finally {
            attempt++
          }
        }
      }
    })()

    entry.inflight = promise

    try {
      await promise
    } finally {
      if (entry.inflight === promise) {
        entry.inflight = null
        entry.abort = null
      }
    }
  }

  /** @param configOrStaleMs Must be non-negative integers when numeric values are provided. */
  async prefetch<T = unknown>(
    key: Query.Key,
    fetcher: Query.Fetcher<T>,
    staleMs?: number
  ): Promise<void>
  async prefetch<T = unknown>(
    key: Query.Key,
    fetcher: Query.Fetcher<T>,
    config?: Query.Config.Entry
  ): Promise<void>
  async prefetch<T = unknown>(
    key: Query.Key,
    fetcher: Query.Fetcher<T>,
    configOrStaleMs?: Query.Config.Entry | number
  ): Promise<void> {
    if (this.#isDestroyed) return

    const config: Query.Config.Entry | undefined =
      typeof configOrStaleMs === 'number' || configOrStaleMs === undefined
        ? { staleMs: configOrStaleMs }
        : configOrStaleMs

    numberError(
      {
        staleMs: config?.staleMs,
        maxRetries: config?.maxRetries,
        refetchIntervalMs: config?.refetchIntervalMs
      },
      'non-negative-int'
    )

    const entry: Query.Entry = this.ensure({
      key,
      fetcher: fetcher as Query.Fetcher<unknown>,
      config
    })

    if (this.isStale(key)) await this.fetch(key)
    if (this.#subscriberCount(entry.hashed) === 0) this.#scheduleGc(entry)
  }

  set<T = unknown>(key: Query.Key, newQuery: T | ((current: T | undefined) => T)): void {
    if (this.#isDestroyed) return

    const entry: Query.Entry = this.#getEntry(key)

    this.#dispatchState(entry, {
      value:
        newQuery instanceof Function
          ? (newQuery as (current: T | undefined) => T)(entry.state.value as T | undefined)
          : newQuery,
      updatedAt: Date.now()
    })
    this.#emitMetric({ type: 'cache:update', key: entry.key, source: 'manual' })

    if (this.#subscriberCount(entry.hashed) === 0) this.#scheduleGc(entry)
  }

  get<T = unknown>(key: Query.Key): T | undefined {
    return this.#entries.get(hash(key))?.state.value as T | undefined
  }

  subscribe({ hashed, listener }: { hashed: string; listener: Query.Listener }): void {
    if (this.#isDestroyed) return

    const entry: Query.Entry | undefined = this.#entries.get(hashed)
    if (!entry) return

    this.#unscheduleGc(entry)

    if (!this.#listeners.has(hashed)) this.#listeners.set(hashed, new Set())
    this.#listeners.get(hashed)!.add(listener)

    this.#applyRefetchTimer(entry)
    this.#emitMetric({
      type: 'subscribe',
      key: entry.key,
      subscriberCount: this.#subscriberCount(hashed)
    })
  }

  unsubscribe({ hashed, listener }: { hashed: string; listener: Query.Listener }): void {
    const entry: Query.Entry | undefined = this.#entries.get(hashed)
    if (!entry) return

    this.#listeners.get(hashed)?.delete(listener)

    this.#emitMetric({
      type: 'unsubscribe',
      key: entry.key,
      subscriberCount: this.#subscriberCount(hashed)
    })

    if (this.#subscriberCount(hashed) === 0) {
      this.#scheduleGc(entry)

      if (entry.refetchTimer) {
        clearInterval(entry.refetchTimer)
        entry.refetchTimer = undefined
      }
    }
  }

  bindTo<D extends object, T = unknown>({
    key,
    data,
    dataKey,
    signal,
    shouldInitCache = true,
    select
  }: Query.Binding<D, T>): void {
    if (this.#isDestroyed) return

    if (shouldInitCache && this.get<T>(key) === undefined) this.set<D[keyof D]>(key, data[dataKey])

    const subscribeQuery = (
      key: Query.Key,
      listener: (state: Query.State<T>) => void
    ): (() => void) => {
      if (this.#isDestroyed) return NOOP

      const entry: Query.Entry = this.#getEntry(key),
        _listener: Query.Listener = (_: string, state: Query.State<unknown>) =>
          listener(state as Query.State<T>)

      this.subscribe({ hashed: entry.hashed, listener: _listener })
      listener(entry.state as Query.State<T>)

      return () => this.unsubscribe({ hashed: entry.hashed, listener: _listener })
    }

    const unsubscribe = subscribeQuery(key, state => {
      data[dataKey] = (
        select ? select(state, data[dataKey]) : (state.value ?? data[dataKey])
      ) as D[keyof D]
    })

    if (!signal) return

    if (signal.aborted) {
      unsubscribe()
      return
    }

    signal.addEventListener('abort', unsubscribe, { once: true })
  }

  async optimisticUpdate<T = unknown>({
    key,
    newQuery,
    mutator,
    maxRetries,
    signal
  }: Query.OptimisticUpdate<T>): Promise<void> {
    if (this.#isDestroyed) return

    const entry: Query.Entry = this.#getEntry(key),
      { lastOptimisticTask }: Query.Entry = entry,
      { promise, resolve }: PromiseWithResolvers<void> = Promise.withResolvers<void>()

    entry.lastOptimisticTask = promise

    if (lastOptimisticTask) {
      this.#emitMetric({ type: 'optimistic:enqueue', key })

      try {
        await watch(lastOptimisticTask.catch(NOOP), signal)
      } catch (error) {
        resolve()
        if (entry.lastOptimisticTask === promise) entry.lastOptimisticTask = undefined
        throw error
      }
    }

    this.abort({ key, isExactlyMatched: true })

    entry.isOptimistic = true
    this.#emitMetric({ type: 'optimistic:start', key })

    const { value }: { value?: T } = entry.state as Query.State<T>
    this.#dispatchState(entry, {
      value: newQuery instanceof Function ? newQuery(value) : newQuery,
      updatedAt: Date.now()
    })
    this.#emitMetric({ type: 'cache:update', key, source: 'optimistic' })

    const startedAt: number = performance.now()
    let attempt: number = 0

    try {
      while (true) {
        attempt++

        try {
          this.#dispatchState(entry, { value: await mutator(), updatedAt: Date.now() })
          this.#emitMetric({ type: 'cache:update', key: entry.key, source: 'optimistic' })
          this.#endOptimisticUpdate({ entry, result: 'success', attempt, startedAt })

          return
        } catch (error) {
          if (
            !shouldRetry({
              error,
              attempt,
              maxRetries: maxRetries ?? this.#config.maxRetries,
              signal
            })
          ) {
            this.#dispatchState(entry, { value, updatedAt: Date.now() })
            this.#endOptimisticUpdate({ entry, result: 'reverted', attempt, startedAt })
            throw error
          }

          try {
            await delay(getDelayMs({ error, attempt, maxDelayMs: this.#config.maxDelayMs }), signal)
          } catch {
            this.#dispatchState(entry, { value, updatedAt: Date.now() })
            this.#endOptimisticUpdate({ entry, result: 'reverted', attempt, startedAt })

            /** @remarks Rethrows mutator()'s original error, not delay()'s AbortError. */
            throw error
          }
        }
      }
    } finally {
      resolve()
      if (entry.lastOptimisticTask === promise) entry.lastOptimisticTask = undefined
    }
  }

  expire(filter?: Query.Filter): void {
    for (const entry of this.#match(filter as Query.Filter | undefined)) {
      this.#dispatchState(entry, { updatedAt: 0 })

      if (this.#isRefetchable(entry)) void this.fetch(entry.key)
    }
  }

  abort(filter?: Query.Filter): void {
    for (const entry of this.#match(filter as Query.Filter | undefined)) {
      if (!entry.abort) continue

      entry.abort.abort()
      entry.fetchId++
      entry.inflight = null

      if (entry.state.isFetching) this.#dispatchState(entry, { isFetching: false })
    }
  }

  destroy(): void {
    if (this.#isDestroyed) return

    this.#isDestroyed = true

    for (const entry of this.#entries.values()) {
      entry.abort?.abort()
      this.#unscheduleGc(entry)
      if (entry.refetchTimer) clearInterval(entry.refetchTimer)

      this.#emitMetric({ type: 'cache:evict', key: entry.key, reason: 'destroy' })
    }

    this.#entries.clear()
    this.#listeners.clear()

    if (this.#onOnline) window.removeEventListener('online', this.#onOnline)
    if (this.#onChangeVisibility)
      window.removeEventListener('visibilitychange', this.#onChangeVisibility)
  }

  get api(): Query.Api {
    if (!this.#api)
      this.#api = {
        prefetch: this.prefetch.bind(this),
        set: this.set.bind(this),
        get: this.get.bind(this),
        bindTo: this.bindTo.bind(this),
        optimisticUpdate: this.optimisticUpdate.bind(this),
        expire: this.expire.bind(this),
        abort: this.abort.bind(this)
      }

    return this.#api
  }
}
