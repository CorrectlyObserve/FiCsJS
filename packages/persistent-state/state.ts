import { browserError, numberError, uid } from '../core/helpers'
import type { SingleOrArray } from '../core/types'
import type { Backoff, Options, QueryOptions, Snapshot, State } from './type'

const generator: Generator<number> = uid(),
  STATE_STORE = 'states' as const,
  SNAPSHOT_STORE = 'snapshots' as const,
  STATE_ID_INDEX = 'stateId' as const,
  COMPOSITE_ID_INDEX = 'compositeId' as const

export default class PersistentState<S> {
  readonly #stateId: string
  readonly #state: S
  readonly #readonly: boolean = false
  readonly #backoff: Backoff = {
    maxRetry: 10,
    interval: 100,
    multiplier: 1.5,
    maxDelay: 30_000,
    jitter: 100
  }
  readonly #isForcedUpgrade: boolean = false
  #db!: IDBDatabase
  #initPromise?: Promise<void>
  #isDeleted = false

  constructor(state: S, options?: Options) {
    browserError()

    this.#stateId = `fics-persistent-state-${generator.next().value}`
    this.#state = state
    if (options) {
      const { readonly, backoff, forcedUpgrade }: Options = options

      if (readonly) this.#readonly = readonly
      if (backoff) {
        numberError(backoff)
        this.#backoff = { ...this.#backoff, ...backoff }
      }
      if (forcedUpgrade) this.#isForcedUpgrade = forcedUpgrade
    }
  }

  #assertAlive(): void {
    if (this.#isDeleted) throw new Error('This persistent state instance is deleted...')
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

    let { snapshotId, isOnlyKey }: QueryOptions = options || {}

    if (snapshotId !== undefined) {
      snapshotId = snapshotId.trim()
      if (!snapshotId) throw new Error('The "snapshotId" must be a non-empty string...')
    }

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

  async #init(): Promise<void> {
    if (this.#db) return
    if (this.#initPromise) return this.#initPromise

    let attempt = 0

    this.#initPromise = (async () => {
      while (true)
        try {
          const db: IDBDatabase = await new Promise<IDBDatabase>((resolve, reject) => {
            const req: IDBOpenDBRequest = indexedDB.open('ficsPersistentStates', 1)

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
                store.createIndex(COMPOSITE_ID_INDEX, [STATE_ID_INDEX, 'snapshotId'], {
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
              readonly: this.#readonly,
              createdAt: now,
              updatedAt: now
            })
            await this.#awaitTransaction(store)
          }

          attempt = 0
          return
        } catch (error) {
          attempt++

          const { maxRetry, interval, multiplier, maxDelay, jitter }: Backoff = this.#backoff

          if (attempt > maxRetry) {
            this.#initPromise = undefined
            throw error
          }

          const delay: number =
            Math.min(interval * multiplier ** (attempt - 1), maxDelay) + Math.random() * jitter

          await new Promise(resolve => setTimeout(resolve, attempt - 1 === 0 ? 0 : delay))
          this.#initPromise = undefined
        }
    })()

    return this.#initPromise
  }

  async get(): Promise<S> {
    this.#assertAlive()
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore({ isReadonly: true }),
      state: State<S> | undefined = await this.#promisifyReq(store)

    if (!state) {
      store.transaction?.abort()
      throw new Error('The state is not found...')
    }

    return state.state
  }

  async set(newState: S): Promise<void> {
    this.#assertAlive()
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(),
      state: State<S> | undefined = await this.#promisifyReq(store)

    if (!state) {
      store.transaction?.abort()
      throw new Error('The state is not found...')
    }

    if (state.readonly) {
      store.transaction?.abort()
      throw new Error('The state is readonly...')
    }

    store.put({ ...state, state: newState, updatedAt: Date.now() })
    await this.#awaitTransaction(store)
  }

  async delete(options?: { cascade?: boolean }): Promise<void> {
    this.#assertAlive()
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(),
      key: IDBValidKey | undefined = await this.#promisifyReq(store, { isOnlyKey: true })

    if (!key) {
      store.transaction?.abort()
      throw new Error('The state is not found...')
    }

    store.delete(key)
    this.#isDeleted = true

    if (options?.cascade) {
      const store: IDBObjectStore = this.#getObjectStore({ isSnapshot: true })

      for (const { id } of await this.#promisifyReq<Snapshot<S>[]>(store, { isAllSnapshots: true }))
        if (id !== undefined) store.delete(id)

      await this.#awaitTransaction(store)
    }
  }

  async saveSnapshot(snapshotId: string): Promise<number> {
    this.#assertAlive()

    snapshotId = snapshotId.trim()
    if (!snapshotId) throw new Error('The "snapshotId" must be a non-empty string...')

    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore({ isSnapshot: true }),
      snapshot: Snapshot<S> | undefined = await this.#promisifyReq(store, { snapshotId }),
      state: Awaited<S> = await this.get()

    if (snapshot) {
      store.transaction?.abort()
      throw new Error(`The snapshot with snapshot ID:${snapshotId} already exists...`)
    }

    const now: number = Date.now(),
      req: IDBRequest<IDBValidKey> = store.add({
        stateId: this.#stateId,
        snapshotId,
        state,
        readonly: true,
        createdAt: now,
        updatedAt: now
      }),
      key: IDBValidKey = await this.#promisifyReq(req)

    await this.#awaitTransaction(store)
    return key as number
  }

  async getAllSnapshots(): Promise<S[]> {
    this.#assertAlive()
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore({ isSnapshot: true, isReadonly: true }),
      snapshots: Snapshot<S>[] = await this.#promisifyReq(store, { isAllSnapshots: true })

    return snapshots.map(({ state }) => state)
  }

  async getSnapshot(snapshotId: string): Promise<S> {
    this.#assertAlive()

    snapshotId = snapshotId.trim()
    if (!snapshotId) throw new Error('The "snapshotId" must be a non-empty string...')

    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore({ isSnapshot: true, isReadonly: true }),
      snapshot: Snapshot<S> | undefined = await this.#promisifyReq(store, { snapshotId })

    if (!snapshot) {
      store.transaction?.abort()
      throw new Error(`The snapshot with snapshot ID:${snapshotId} is not found...`)
    }

    return snapshot.state
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    this.#assertAlive()

    snapshotId = snapshotId.trim()
    if (!snapshotId) throw new Error('The "snapshotId" must be a non-empty string...')

    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore({ isSnapshot: true }),
      key: IDBValidKey | undefined = await this.#promisifyReq(store, {
        snapshotId,
        isOnlyKey: true
      })

    if (!key) {
      store.transaction?.abort()
      throw new Error(`The snapshot with snapshot ID:${snapshotId} is not found...`)
    }

    store.delete(key)
    await this.#awaitTransaction(store)
  }
}
