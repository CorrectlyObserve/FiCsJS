import { browserError, uid } from '../core/helpers'
import type { Snapshot, State } from './type'

const generator: Generator<number> = uid()
const DB_NAME = 'PersistentStateDB' as const
const STATE_STORE = 'state' as const

export class PersistentState<S> {
  #db!: IDBDatabase
  readonly #key: string
  readonly #state: S
  readonly #readonly: boolean = false

  constructor(state: S, options?: { readonly: boolean }) {
    browserError()

    this.#key = `fics-persistent-state-${generator.next().value}`
    this.#state = state
    if (options) this.#readonly = options.readonly
  }

  get #snapshot(): string {
    return `snapshot-${this.#key}`
  }

  #getObjectStore(isSnapshot?: boolean, isReadonly?: boolean): IDBObjectStore {
    const storeName: string = isSnapshot ? this.#snapshot : STATE_STORE
    const mode: IDBTransactionMode = isReadonly ? 'readonly' : 'readwrite'
    return this.#db.transaction(storeName, mode).objectStore(storeName)
  }

  #getReq(store: IDBObjectStore, key: string = this.#key, isOnlyKey?: boolean): IDBRequest {
    const index: IDBIndex = store.index('key')
    return isOnlyKey ? index.getKey(key) : index.get(key)
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

    const createStore = (db: IDBDatabase, storeName: string): void => {
      const store: IDBObjectStore = db.createObjectStore(storeName, {
        keyPath: 'id',
        autoIncrement: true
      })
      store.createIndex('key', 'key', { unique: true })
      store.createIndex('state', 'state', { unique: false })
      store.createIndex('readonly', 'readonly', { unique: false })
      store.createIndex('createdAt', 'createdAt', { unique: false })
      store.createIndex('updatedAt', 'updatedAt', { unique: false })
    }

    const db: IDBDatabase = await new Promise<IDBDatabase>((resolve, reject) => {
      const req: IDBOpenDBRequest = indexedDB.open(DB_NAME, 1)
      const { result }: { result: IDBDatabase } = req

      req.onupgradeneeded = () => {
        if (!result.objectStoreNames.contains(STATE_STORE)) createStore(db, STATE_STORE)
      }
      req.onsuccess = () => resolve(result)
      req.onerror = () => reject(req.error)
    })

    this.#db = db

    if (!db.objectStoreNames.contains(this.#snapshot)) {
      const req: IDBOpenDBRequest = indexedDB.open(DB_NAME, db.version + 1)

      await new Promise<void>((resolve, reject) => {
        req.onupgradeneeded = () => createStore(db, this.#snapshot)
        req.onsuccess = () => {
          this.#db = req.result
          resolve()
        }
        req.onerror = () => reject(req.error)
      })
    }

    const state: State<S> | undefined = await new Promise(resolve => {
      const req: IDBRequest<State<S>> = this.#getReq(this.#getObjectStore(false, true))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(undefined)
    })

    if (!state) {
      const store: IDBObjectStore = this.#getObjectStore()
      const now: number = Date.now()

      store.add({
        key: this.#key,
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

  async get(): Promise<State<S>> {
    await this.#init()

    const state: State<S> | undefined = await this.#promisifyReq(
      this.#getReq(this.#getObjectStore(false, true))
    )

    if (!state) throw new Error('The state is not found...')

    return state
  }

  async set(newState: S): Promise<void> {
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore()
    const req: IDBRequest<State<S>> = this.#getReq(store)

    req.onsuccess = () => {
      const { result }: { result: State<S> } = req
      if (result.readonly) throw new Error('The state cannot be edited because this is readonly...')

      store.put({ ...result, state: newState, updatedAt: Date.now() })
    }

    await this.#awaitTransaction(store)
  }

  async delete(): Promise<void> {
    await this.#init()
    const store: IDBObjectStore = this.#getObjectStore()
    const validKey: IDBValidKey | undefined = await this.#promisifyReq<IDBValidKey>(
      this.#getReq(store, this.#key, true)
    )

    if (!validKey) throw new Error('The state is not found...')

    store.delete(validKey)
    await this.#awaitTransaction(store)
  }

  async saveSnapshot(key: string): Promise<number> {
    await this.#init()

    const { state }: { state: S } = await this.get()

    return new Promise((resolve, reject) => {
      const store: IDBObjectStore = this.#getObjectStore(true)
      const req: IDBRequest<Snapshot<S>> = this.#getReq(store, key)
      req.onsuccess = () => {
        if (req.result) reject(new Error(`The snapshot with key:${key} already exists...`))
        else {
          const now: number = Date.now()
          const _req: IDBRequest<IDBValidKey> = store.add({
            key,
            state,
            readonly: true,
            createdAt: now,
            updatedAt: now
          })
          _req.onsuccess = () => resolve(_req.result as number)
          _req.onerror = () => reject(_req.error)
        }
      }
      req.onerror = () => reject(req.error)
    })
  }

  async getAllSnapshots(): Promise<Snapshot<S>[]> {
    await this.#init()
    return this.#promisifyReq<Snapshot<S>[]>(this.#getObjectStore(true, true).getAll())
  }

  async getSnapshot(key: string): Promise<Snapshot<S>> {
    await this.#init()

    const snapshot: Snapshot<S> | undefined = await this.#promisifyReq(
      this.#getReq(this.#getObjectStore(true, true), key)
    )
    if (!snapshot) throw new Error(`The snapshot with key:${key} is not found...`)

    return snapshot
  }

  async deleteSnapshot(key: string): Promise<void> {
    await this.#init()

    const store: IDBObjectStore = this.#getObjectStore(true)
    const validKey: IDBValidKey | undefined = await this.#promisifyReq(
      this.#getReq(store, key, true)
    )

    if (!validKey) throw new Error(`The snapshot with key:${key} is not found...`)

    store.delete(validKey)
    await this.#awaitTransaction(store)
  }
}
