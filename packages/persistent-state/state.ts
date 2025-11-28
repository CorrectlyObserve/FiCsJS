import { browserError, numberError, uid } from '../core/helpers'
import type { Backoff, Snapshot, State } from './type'

const generator: Generator<number> = uid(),
  STATE_STORE = 'states' as const,
  SNAPSHOT_STORE = 'snapshots' as const

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

  constructor(
    state: S,
    options?: { readonly?: boolean; backoff?: Partial<Backoff>; forcedUpgrade?: boolean }
  ) {
    browserError()

    this.#stateId = `fics-persistent-state-${generator.next().value}`
    this.#state = state
    if (options) {
      const {
        readonly,
        backoff,
        forcedUpgrade
      }: { readonly?: boolean; backoff?: Partial<Backoff>; forcedUpgrade?: boolean } = options

      if (readonly) this.#readonly = readonly
      if (backoff) {
        numberError(backoff)
        this.#backoff = { ...this.#backoff, ...backoff }
      }
      if (forcedUpgrade) this.#isForcedUpgrade = forcedUpgrade
    }
  }

  #getObjectStore(isSnapshot?: boolean, isReadonly?: boolean): IDBObjectStore {
    const storeName: string = isSnapshot ? SNAPSHOT_STORE : STATE_STORE,
      mode: IDBTransactionMode = isReadonly ? 'readonly' : 'readwrite'

    return this.#db.transaction(storeName, mode).objectStore(storeName)
  }

  #getStateReq<T>(store: IDBObjectStore, isOnlyKey?: boolean): IDBRequest<T> {
    const index: IDBIndex = store.index('stateId')

    return isOnlyKey
      ? (index.getKey(this.#stateId) as unknown as IDBRequest<T>)
      : index.get(this.#stateId)
  }

  #promisifyReq<T>(req: IDBRequest<T>): Promise<T> {
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
              const { result }: { result: IDBDatabase } = req

              if (!result.objectStoreNames.contains(STATE_STORE)) {
                const store: IDBObjectStore = result.createObjectStore(STATE_STORE, {
                  keyPath: 'id',
                  autoIncrement: true
                })
                store.createIndex('stateId', 'stateId', { unique: true })
              }

              if (!result.objectStoreNames.contains(SNAPSHOT_STORE)) {
                const store = result.createObjectStore(SNAPSHOT_STORE, {
                  keyPath: 'id',
                  autoIncrement: true
                })
                store.createIndex('stateId', 'stateId', { unique: false })
                store.createIndex('compositeId', ['stateId', 'snapshotId'], { unique: true })
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

          const store: IDBObjectStore = this.#getObjectStore(false, true),
            req: IDBRequest<State<S> | undefined> = this.#getStateReq(store),
            state: State<S> | undefined = await this.#promisifyReq(req)

          if (!state) {
            const store: IDBObjectStore = this.#getObjectStore(),
              now: number = Date.now()

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

  #getSnapshotReq<T>(
    store: IDBObjectStore,
    snapshotId: string,
    isOnlyKey?: boolean
  ): IDBRequest<T> {
    snapshotId = snapshotId.trim()
    if (!snapshotId) throw new Error('The "snapshotId" must be a non-empty string...')

    const index: IDBIndex = store.index('compositeId'),
      compositeId: [string, string] = [this.#stateId, snapshotId]

    return isOnlyKey
      ? (index.getKey(compositeId) as unknown as IDBRequest<T>)
      : index.get(compositeId)
  }

  async get(): Promise<S> {
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(false, true),
      req: IDBRequest<State<S> | undefined> = this.#getStateReq(store),
      result: State<S> | undefined = await this.#promisifyReq(req)

    if (!result) {
      store.transaction?.abort()
      throw new Error('The state is not found...')
    }

    return result.state
  }

  async set(newState: S): Promise<void> {
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(),
      req: IDBRequest<State<S> | undefined> = this.#getStateReq(store),
      result = await this.#promisifyReq<State<S> | undefined>(req)

    if (!result) {
      store.transaction?.abort()
      throw new Error('The state is not found...')
    }

    if (result.readonly) {
      store.transaction?.abort()
      throw new Error('The state is readonly...')
    }

    store.put({ ...result, state: newState, updatedAt: Date.now() })
    await this.#awaitTransaction(store)
  }

  async delete(): Promise<void> {
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(),
      req: IDBRequest<IDBValidKey | undefined> = this.#getStateReq(store, true),
      validKey: IDBValidKey | undefined = await this.#promisifyReq(req)

    if (!validKey) {
      store.transaction?.abort()
      throw new Error('The state is not found...')
    }

    store.delete(validKey)
    await this.#awaitTransaction(store)
  }

  async saveSnapshot(snapshotId: string): Promise<number> {
    snapshotId = snapshotId.trim()
    if (!snapshotId) throw new Error('The "snapshotId" must be a non-empty string...')

    await this.#init()

    const state: Awaited<S> = await this.get(),
      store: IDBObjectStore = this.#getObjectStore(true),
      existing: Snapshot<S> | undefined = await this.#promisifyReq<Snapshot<S> | undefined>(
        this.#getSnapshotReq(store, snapshotId)
      )

    if (existing) {
      store.transaction?.abort()
      throw new Error(`The snapshot with snapshot id:${snapshotId} already exists...`)
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
      key: IDBValidKey = await this.#promisifyReq<IDBValidKey>(req)

    await this.#awaitTransaction(store)
    return key as number
  }

  async getAllSnapshots(): Promise<S[]> {
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(true, true),
      req: IDBRequest<Snapshot<S>[]> = store.index('stateId').getAll(this.#stateId),
      result: Snapshot<S>[] = await this.#promisifyReq<Snapshot<S>[]>(req)

    return result.map(({ state }) => state)
  }

  async getSnapshot(snapshotId: string): Promise<S> {
    snapshotId = snapshotId.trim()
    if (!snapshotId) throw new Error('The "snapshotId" must be a non-empty string...')

    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(true, true),
      req: IDBRequest<Snapshot<S>> = this.#getSnapshotReq(store, snapshotId),
      result: Snapshot<S> | undefined = await this.#promisifyReq(req)

    if (!result) {
      store.transaction?.abort()
      throw new Error(`The snapshot with snapshot id:${snapshotId} is not found...`)
    }

    return result.state
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    snapshotId = snapshotId.trim()
    if (!snapshotId) throw new Error('The "snapshotId" must be a non-empty string...')

    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(true),
      req: IDBRequest<IDBValidKey | undefined> = this.#getSnapshotReq(store, snapshotId, true),
      validKey: IDBValidKey | undefined = await this.#promisifyReq(req)

    if (!validKey) {
      store.transaction?.abort()
      throw new Error(`The snapshot with snapshot id:${snapshotId} is not found...`)
    }

    store.delete(validKey)
    await this.#awaitTransaction(store)
  }
}
