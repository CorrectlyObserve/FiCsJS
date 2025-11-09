import { browserError, uid } from '../core/helpers'
import type { Snapshot, State } from './type'

const generator: Generator<number> = uid(),
  STATE_STORE = 'states' as const,
  SNAPSHOT_STORE = 'snapshots' as const

export default class PersistentState<S> {
  #db!: IDBDatabase
  readonly #stateId: string
  readonly #state: S
  readonly #readonly: boolean = false

  constructor(state: S, options?: { readonly: boolean }) {
    browserError()

    this.#stateId = `fics-persistent-state-${generator.next().value}`
    this.#state = state
    if (options) this.#readonly = options.readonly
  }

  #getObjectStore(isSnapshot?: boolean, isReadonly?: boolean): IDBObjectStore {
    const storeName: string = isSnapshot ? SNAPSHOT_STORE : STATE_STORE,
      mode: IDBTransactionMode = isReadonly ? 'readonly' : 'readwrite'

    return this.#db.transaction(storeName, mode).objectStore(storeName)
  }

  #getStateReq(store: IDBObjectStore, isOnlyKey?: boolean): IDBRequest {
    const index: IDBIndex = store.index('stateId')
    return isOnlyKey ? index.getKey(this.#stateId) : index.get(this.#stateId)
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
    })

    this.#db = db

    const state: State<S> | undefined = await new Promise(resolve => {
      const req: IDBRequest<State<S>> = this.#getStateReq(this.#getObjectStore(false, true))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(undefined)
    })

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
  }

  #promisifyReq<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  #getSnapshotReq(store: IDBObjectStore, snapshotId: string, isOnlyKey?: boolean): IDBRequest {
    const index: IDBIndex = store.index('compositeId'),
      compositeId: [string, string] = [this.#stateId, snapshotId]

    return isOnlyKey ? index.getKey(compositeId) : index.get(compositeId)
  }

  async get(): Promise<S> {
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(false, true),
      req: IDBRequest<State<S> | undefined> = this.#getStateReq(store),
      result: State<S> | undefined = await this.#promisifyReq(req)

    if (!result) throw new Error('The state is not found...')

    return result.state
  }

  async set(newState: S): Promise<void> {
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(),
      req: IDBRequest<State<S>> = this.#getStateReq(store)

    req.onsuccess = () => {
      const { result }: { result: State<S> } = req
      if (result.readonly) throw new Error('The state is readonly...')

      store.put({ ...result, state: newState, updatedAt: Date.now() })
    }

    await this.#awaitTransaction(store)
  }

  async delete(): Promise<void> {
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(),
      req: IDBRequest<IDBValidKey | undefined> = this.#getStateReq(store, true),
      validKey: IDBValidKey | undefined = await this.#promisifyReq(req)

    if (!validKey) throw new Error('The state is not found...')

    store.delete(validKey)
    await this.#awaitTransaction(store)
  }

  async saveSnapshot(snapshotId: string): Promise<number> {
    await this.#init()

    const state: S = await this.get()

    return new Promise((resolve, reject) => {
      const store: IDBObjectStore = this.#getObjectStore(true),
        req: IDBRequest<Snapshot<S>> = this.#getSnapshotReq(store, snapshotId)

      req.onsuccess = () => {
        if (req.result)
          return reject(new Error(`The snapshot with snapshot id:${snapshotId} already exists...`))

        const now: number = Date.now(),
          _req: IDBRequest<IDBValidKey> = store.add({
            stateId: this.#stateId,
            snapshotId,
            state,
            readonly: true,
            createdAt: now,
            updatedAt: now
          })
        _req.onsuccess = () => resolve(_req.result as number)
        _req.onerror = () => reject(_req.error)
      }
      req.onerror = () => reject(req.error)
    })
  }

  async getAllSnapshots(): Promise<S[]> {
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(true, true),
      req: IDBRequest<State<S>[]> = store.index('stateId').getAll(this.#stateId),
      result: State<S>[] = await this.#promisifyReq<State<S>[]>(req)

    return result.map(snapshot => snapshot.state)
  }

  async getSnapshot(snapshotId: string): Promise<S> {
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(true, true),
      req: IDBRequest<Snapshot<S>> = this.#getSnapshotReq(store, snapshotId),
      result: Snapshot<S> = await this.#promisifyReq(req)

    if (!result) throw new Error(`The snapshot with snapshot id:${snapshotId} is not found...`)

    return result.state
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(true),
      req: IDBRequest<IDBValidKey | undefined> = this.#getSnapshotReq(store, snapshotId, true),
      validKey: IDBValidKey | undefined = await this.#promisifyReq(req)

    if (!validKey) throw new Error(`The snapshot with snapshot id:${snapshotId} is not found...`)

    store.delete(validKey)
    await this.#awaitTransaction(store)
  }
}
