import {
  browserError,
  deepEqual,
  getDelayMs,
  isBlankString,
  MAX_RETRIES,
  numberError,
  uid
} from '../core/helpers'
import type { SingleOrArray } from '../core/types'
import { constants } from './constants'
import type { Ctx, Metric, QueryOptions, Snapshot, State, SyncPayload } from './types'

const {
  COMPOSITE_ID_INDEX,
  SNAPSHOT_ID_INDEX,
  SNAPSHOT_STORE,
  STATE_ID_INDEX,
  STATE_STORE,
  VERSION
} = constants

export class PersistentState<S> {
  readonly #stateId: string
  readonly #state: S
  readonly #readonly: boolean = false
  readonly #intervalMs?: number
  readonly #maxRetries?: number
  readonly #isForcedUpgrade: boolean = false
  readonly #subscribers: Map<string, (state: S) => void> = new Map()
  readonly #metricSubscribers: Set<(metric: Metric) => void> = new Set()
  #db!: IDBDatabase
  #initPromise?: Promise<void>
  #channel?: BroadcastChannel
  #isDeleted = false

  constructor({ stateId, state, options }: Ctx<S>) {
    browserError()

    this.#stateId = `fics-persistent-state-${generator.next().value}`
    this.#state = state
    if (options) {
      const { readonly, intervalMs, maxRetries, forcedUpgrade }: Options = options

      if (readonly) this.#readonly = readonly

      numberError({ intervalMs, maxRetries }, 'non-negative-int')
      this.#intervalMs = intervalMs
      this.#maxRetries = maxRetries

      if (forcedUpgrade) this.#isForcedUpgrade = forcedUpgrade
    }
  }

  #assertAlive(): void {
    if (this.#isDeleted) throw new Error('This persistent state has been already deleted...')
  }

  #getObjectStore(options?: { isSnapshot?: boolean; isReadonly?: boolean }): IDBObjectStore {
    const storeName: string = options?.isSnapshot ? SNAPSHOT_STORE : STATE_STORE

    return this.#db
      .transaction(storeName, options?.isReadonly ? 'readonly' : 'readwrite')
      .objectStore(storeName)
  }

  #promisifyReq<T>(store: IDBObjectStore, options?: QueryOptions): Promise<T>
  #promisifyReq<T>(store: IDBObjectStore, options: { isAllSnapshots: true }): Promise<Snapshot<S>[]>
  #promisifyReq(req: IDBRequest<IDBValidKey>): Promise<IDBValidKey>
  #promisifyReq<T>(
    arg: IDBObjectStore | IDBRequest<IDBValidKey>,
    options?: QueryOptions | { isAllSnapshots: true }
  ): Promise<T | Snapshot<S>[] | IDBValidKey> {
    if (arg instanceof IDBRequest)
      return new Promise((resolve, reject) => {
        arg.onsuccess = () => resolve(arg.result as unknown as T)
        arg.onerror = () => reject(arg.error)
      })

    if (options?.isAllSnapshots) {
      const allSnapshotsReq: IDBRequest<Snapshot<S>[]> = arg
        .index(STATE_ID_INDEX)
        .getAll(this.#stateId)

      return new Promise((resolve, reject) => {
        allSnapshotsReq.onsuccess = () => resolve(allSnapshotsReq.result)
        allSnapshotsReq.onerror = () => reject(allSnapshotsReq.error)
      })
    }

    let { snapshotId, isOnlyKey }: QueryOptions = options ?? {}
    if (snapshotId !== undefined) snapshotId = this.#normalizeSnapshotId(snapshotId)

    const index: IDBIndex = arg.index(snapshotId ? COMPOSITE_ID_INDEX : STATE_ID_INDEX),
      id: SingleOrArray<string> = snapshotId ? [this.#stateId, snapshotId] : this.#stateId,
      req: IDBRequest<T> = isOnlyKey
        ? (index.getKey(id) as unknown as IDBRequest<T>)
        : index.get(id)

    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  async #awaitTransaction(store: IDBObjectStore): Promise<void> {
    const { transaction }: { transaction: IDBTransaction } = store

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  }

  #emitMetric(metric: Metric): void {
    if (this.#metricSubscribers.size === 0) return

    for (const subscriber of this.#metricSubscribers)
      try {
        subscriber(metric)
      } catch {}
  }

  async #track<T>({
    type,
    task,
    payload
  }: {
    type: Metric['type']
    task: () => Promise<T>
    payload?: (result: T | undefined) => { snapshotId?: string; snapshotCount?: number }
  }): Promise<T> {
    const startedAt: number = performance.now()

    try {
      const result: T = await task()

      this.#emitMetric({
        type,
        stateId: this.#stateId,
        durationMs: performance.now() - startedAt,
        ...payload?.(result)
      } as Metric)

      return result
    } catch (error) {
      this.#emitMetric({
        type,
        stateId: this.#stateId,
        durationMs: performance.now() - startedAt,
        error,
        ...payload?.(undefined)
      } as Metric)

      throw error
    }
  }

  async #init(): Promise<void> {
    if (this.#db) return
    if (this.#initPromise) return this.#initPromise

    let attempt = 0

    this.#initPromise = (async () => {
      while (true) {
        attempt++
        const startedAt: number = performance.now()

        try {
          const db: IDBDatabase = await new Promise<IDBDatabase>((resolve, reject) => {
            const req: IDBOpenDBRequest = indexedDB.open('fics_persistent_states', VERSION)

            req.onupgradeneeded = () => {
              const { result }: { result: IDBDatabase } = req,
                storeParams: IDBObjectStoreParameters = { keyPath: 'id', autoIncrement: true }

              if (!result.objectStoreNames.contains(STATE_STORE)) {
                const store: IDBObjectStore = result.createObjectStore(STATE_STORE, storeParams)
                store.createIndex(STATE_ID_INDEX, STATE_ID_INDEX, { unique: true })
              }

              if (!result.objectStoreNames.contains(SNAPSHOT_STORE)) {
                const store: IDBObjectStore = result.createObjectStore(SNAPSHOT_STORE, storeParams)
                store.createIndex(STATE_ID_INDEX, STATE_ID_INDEX, { unique: false })
                store.createIndex(COMPOSITE_ID_INDEX, [STATE_ID_INDEX, SNAPSHOT_ID_INDEX], {
                  unique: true
                })
              }
            }

            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
            req.onblocked = () =>
              console.warn('Please close other tabs to complete the IndexedDB upgrade...')
          })

          db.onversionchange = () => {
            db.close()
            if (this.#isForcedUpgrade) window.location.reload()
          }

          this.#db = db
          const store: IDBObjectStore = this.#getObjectStore()

          if (!(await this.#promisifyReq<State<S> | undefined>(store))) {
            const now: number = Date.now()

            store.add({
              stateId: this.#stateId,
              state: this.#state,
              createdAt: now,
              updatedAt: now
            })
            await this.#awaitTransaction(store)
          }

          this.#emitMetric({
            type: 'init',
            stateId: this.#stateId,
            durationMs: performance.now() - startedAt,
            attempt
          })

          return
        } catch (error) {
          this.#emitMetric({
            type: 'init',
            stateId: this.#stateId,
            durationMs: performance.now() - startedAt,
            attempt,
            error
          })

          if (attempt > (this.#maxRetries ?? MAX_RETRIES)) {
            this.#initPromise = undefined
            throw new Error(`PersistentState initialization failed after ${attempt} retries.`, {
              cause: error
            })
          }

          await new Promise(resolve =>
            setTimeout(resolve, getDelayMs({ error, attempt, intervalMs: this.#intervalMs }))
          )
          this.#initPromise = undefined
        }
      }
    })()

    return this.#initPromise
  }

  #abortTransaction(store: IDBObjectStore, error: string): never {
    if (store.transaction?.mode === 'readwrite') store.transaction.abort()
    throw new Error(error)
  }

  #sendSyncPayload(payload: SyncPayload<S>): void {
    if (typeof BroadcastChannel === 'undefined') return

    if (this.#channel) {
      this.#channel.postMessage(payload)
      return
    }

    const channel: BroadcastChannel = new BroadcastChannel(this.#stateId)
    channel.postMessage(payload)
    queueMicrotask(() => channel.close())
  }

  #callSubscribers(state: S): Error[] {
    const errors: Error[] = []

    for (const [key, subscriber] of Array.from(this.#subscribers))
      try {
        subscriber(state)
      } catch (error) {
        const cause: Error = error instanceof Error ? error : new Error(String(error))

        errors.push(
          new Error(
            `The subscriber "${key}" of the state "${this.#stateId}" failed during the notification...`,
            { cause }
          )
        )
      }

    return errors
  }

  #normalizeKey(key: string, type: 'subscribe' | 'unsubscribe'): string {
    key = key.trim()

    if (isBlankString(key))
      throw new Error(`The subscriber key to ${type} must be a non-empty string...`)

    if (type === 'subscribe' && this.#subscribers.has(key))
      throw new Error(`The subscriber key "${key}" is already registered...`)

    if (type === 'unsubscribe' && !this.#subscribers.has(key))
      throw new Error(`The subscriber key "${key}" is not found...`)

    return key
  }

  #syncBetweenCrossTabs(): void {
    if (this.#channel || typeof BroadcastChannel === 'undefined') return

    const channel: BroadcastChannel = new BroadcastChannel(this.#stateId)

    channel.onmessage = (event: MessageEvent<SyncPayload<S>>): void => {
      if (event.data.type === 'set') {
        const errors: Error[] = this.#callSubscribers(event.data.state)

        if (errors.length > 0)
          console.error(
            `Cross-tab subscriber notification failed for state "${this.#stateId}"...`,
            new AggregateError(errors)
          )
      } else if (event.data.type === 'delete') {
        this.#isDeleted = true

        this.#subscribers.clear()
        this.#metricSubscribers.clear()
        this.#channel?.close()
        this.#channel = undefined
      }
    }

    this.#channel = channel
  }

  async get(): Promise<S> {
    this.#assertAlive()

    return this.#track({
      type: 'get',
      task: async () => {
        await this.#init()

        const store: IDBObjectStore = this.#getObjectStore({ isReadonly: true }),
          state: State<S> | undefined = await this.#promisifyReq(store)

        if (!state) throw new Error('The state was not found...')
        return state.state
      }
    })
  }

  subscribe(key: string, callback: (state: S) => void): void {
    this.#assertAlive()

    if (this.#readonly) throw new Error(`The "${this.#stateId}" is readonly...`)

    this.#subscribers.set(this.#normalizeKey(key, 'subscribe'), callback)
    this.#syncBetweenCrossTabs()
  }

  unsubscribe(key?: string): void {
    this.#assertAlive()

    if (key) this.#subscribers.delete(this.#normalizeKey(key, 'unsubscribe'))
    else if (this.#subscribers.size > 0) this.#subscribers.clear()
    else throw new Error(`The state "${this.#stateId}" does not have subscribers...`)

    if (this.#subscribers.size === 0) {
      this.#channel?.close()
      this.#channel = undefined
    }
  }

  subscribeMetric(subscriber: (metric: Metric) => void): () => void {
    this.#assertAlive()
    this.#metricSubscribers.add(subscriber)

    return () => {
      this.#metricSubscribers.delete(subscriber)
    }
  }

  async set(newState: S): Promise<void> {
    this.#assertAlive()

    return this.#track({
      type: 'set',
      task: async () => {
        await this.#init()

        const store: IDBObjectStore = this.#getObjectStore(),
          state: State<S> | undefined = await this.#promisifyReq(store)

        if (!state) return this.#abortTransaction(store, 'The state was not found...')
        if (state.readonly) return this.#abortTransaction(store, 'The state is readonly...')

        if (deepEqual(state.state, newState)) return

        store.put({ ...state, state: newState, updatedAt: Date.now() })
        await this.#awaitTransaction(store)

        this.#sendSyncPayload({ type: 'set', state: newState, timestamp: Date.now() })

        const errors: Error[] = this.#callSubscribers(newState)
        if (errors.length > 0) throw new AggregateError(errors)
      }
    })
  }

  async delete(options?: { cascade?: boolean }): Promise<void> {
    this.#assertAlive()

    return this.#track({
      type: 'delete',
      task: async () => {
        await this.#init()

        const stores: string[] = options?.cascade ? [STATE_STORE, SNAPSHOT_STORE] : [STATE_STORE],
          tx: IDBTransaction = this.#db.transaction(stores, 'readwrite'),
          stateStore: IDBObjectStore = tx.objectStore(STATE_STORE)

        const key: IDBValidKey | undefined = await this.#promisifyReq(stateStore, {
          isOnlyKey: true
        })
        if (!key) return this.#abortTransaction(stateStore, 'The state was not found...')

        stateStore.delete(key)

        if (options?.cascade) {
          const snapshotStore: IDBObjectStore = tx.objectStore(SNAPSHOT_STORE),
            cursorReq: IDBRequest<IDBCursorWithValue | null> = snapshotStore
              .index(STATE_ID_INDEX)
              .openCursor(IDBKeyRange.only(this.#stateId))

          await new Promise<void>((resolve, reject) => {
            cursorReq.onsuccess = () => {
              const { result }: { result: IDBCursorWithValue | null } = cursorReq

              if (result) {
                result.delete()
                result.continue()
              } else resolve()
            }
            cursorReq.onerror = () => reject(cursorReq.error)
          })
        }

        await this.#awaitTransaction(stateStore)
        this.#isDeleted = true

        this.#sendSyncPayload({ type: 'delete', timestamp: Date.now() })

        this.#subscribers.clear()
        this.#metricSubscribers.clear()
        this.#channel?.close()
        this.#channel = undefined
      }
    })
  }

  async saveSnapshot(snapshotId: string): Promise<number> {
    this.#assertAlive()

    snapshotId = this.#normalizeSnapshotId(snapshotId)

    return this.#track({
      type: 'snapshot:save',
      task: async () => {
        await this.#init()

        const tx: IDBTransaction = this.#db.transaction([STATE_STORE, SNAPSHOT_STORE], 'readwrite'),
          stateStore: IDBObjectStore = tx.objectStore(STATE_STORE),
          snapshotStore: IDBObjectStore = tx.objectStore(SNAPSHOT_STORE)

        const [snapshot, currentState]: [Snapshot<S> | undefined, State<S> | undefined] =
          await Promise.all([
            this.#promisifyReq<Snapshot<S> | undefined>(snapshotStore, { snapshotId }),
            this.#promisifyReq<State<S> | undefined>(stateStore)
          ])

        if (snapshot)
          this.#abortTransaction(
            snapshotStore,
            `The snapshot with snapshot ID ${snapshotId} already exists...`
          )

        if (!currentState) this.#abortTransaction(stateStore, 'The state was not found...')

        const now: number = Date.now(),
          req: IDBRequest<IDBValidKey> = snapshotStore.add({
            stateId: this.#stateId,
            snapshotId,
            state: currentState.state,
            readonly: true,
            createdAt: now,
            updatedAt: now
          }),
          key: IDBValidKey = await this.#promisifyReq(req)

        await this.#awaitTransaction(snapshotStore)
        return key as number
      },
      payload: () => ({ snapshotId })
    })
  }

  async getAllSnapshots(): Promise<S[]> {
    this.#assertAlive()

    return this.#track({
      type: 'snapshot:get-all',
      task: async () => {
        await this.#init()

        const store: IDBObjectStore = this.#getObjectStore({ isSnapshot: true, isReadonly: true }),
          snapshots: Snapshot<S>[] = await this.#promisifyReq(store, { isAllSnapshots: true })

        return snapshots.map(({ state }) => state)
      },
      payload: (snapshots: S[] | undefined) => ({ snapshotCount: snapshots?.length ?? 0 })
    })
  }

  async getSnapshot(snapshotId: string): Promise<S> {
    this.#assertAlive()

    snapshotId = this.#normalizeSnapshotId(snapshotId)

    return this.#track({
      type: 'snapshot:get',
      task: async () => {
        await this.#init()

        const store: IDBObjectStore = this.#getObjectStore({ isSnapshot: true, isReadonly: true }),
          snapshot: Snapshot<S> | undefined = await this.#promisifyReq(store, { snapshotId })

        if (!snapshot)
          throw new Error(`The snapshot with snapshot ID ${snapshotId} was not found...`)

        return snapshot.state
      },
      payload: () => ({ snapshotId })
    })
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    this.#assertAlive()

    snapshotId = this.#normalizeSnapshotId(snapshotId)

    return this.#track({
      type: 'snapshot:delete',
      task: async () => {
        await this.#init()

        const store: IDBObjectStore = this.#getObjectStore({ isSnapshot: true }),
          key: IDBValidKey | undefined = await this.#promisifyReq(store, {
            snapshotId,
            isOnlyKey: true
          })

        if (!key)
          return this.#abortTransaction(
            store,
            `The snapshot with snapshot ID ${snapshotId} was not found...`
          )

        store.delete(key)
        await this.#awaitTransaction(store)
      },
      payload: () => ({ snapshotId })
    })
  }
}
