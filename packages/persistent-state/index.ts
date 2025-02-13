import { generateUid } from '../core/helpers'
import type { Snapshot, State } from './type'

const generator: Generator<number> = generateUid()

const getStore = async (
  state: string,
  options: { isSnapshot?: boolean; mode: IDBTransactionMode }
): Promise<IDBObjectStore> => {
  try {
    const { isSnapshot, mode }: { isSnapshot?: boolean; mode: IDBTransactionMode } = options
    const storeName: string = isSnapshot ? state : 'states'
    const openDB = (): Promise<IDBDatabase> =>
      new Promise((resolve, reject) => {
        const request: IDBOpenDBRequest = indexedDB.open('fics-state', 1)
        const getDBRequest = (event: Event): IDBOpenDBRequest => event.target as IDBOpenDBRequest

        request.onupgradeneeded = event => {
          const db: IDBDatabase = getDBRequest(event).result

          if (!db.objectStoreNames.contains(storeName)) {
            const store: IDBObjectStore = db.createObjectStore(storeName, {
              keyPath: 'id',
              autoIncrement: true
            })
            store.createIndex('state', 'state', { unique: false })

            const name = isSnapshot ? 'name' : 'key'
            store.createIndex(name, name, { unique: isSnapshot })

            if (!isSnapshot) store.createIndex('readonly', 'readonly', { unique: false })

            store.createIndex('createdAt', 'createdAt', { unique: false })
            store.createIndex('updatedAt', 'updatedAt', { unique: false })
          }
        }

        request.onsuccess = event => resolve(getDBRequest(event).result)
        request.onerror = event => reject(`Database error: ${getDBRequest(event).error}`)
      })

    return await openDB().then(db => db.transaction(storeName, mode).objectStore(storeName))
  } catch (error) {
    throw new Error((error as Error).message)
  }
}

const throwError = (request: IDBRequest, reject: (error: Error | DOMException) => void): void => {
  request.onerror = () => reject(request.error ?? new Error('An unknown error occurred.'))
}

export const createPersistentState = <S>(
  value: S,
  options?: { readonly: boolean }
): Promise<string> =>
  new Promise(async (resolve, reject) => {
    const key: string = `fics-state-${generator.next().value}`
    const store: IDBObjectStore = await getStore(key, { mode: 'readwrite' })
    const timestamp: number = Date.now()
    const request: IDBRequest<IDBValidKey> = store.add({
      state: value,
      key,
      readonly: !!options?.readonly,
      createdAt: timestamp,
      updatedAt: timestamp
    })

    request.onsuccess = async () => resolve(key)
    throwError(request, reject)
  })

const _getPersistentState = async (key: string): Promise<State> => {
  const getAllStates = async (key: string): Promise<State[]> =>
    new Promise(async (resolve, reject) => {
      const store: IDBObjectStore = await getStore(key, { mode: 'readonly' })
      const request: IDBRequest<State[]> = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('An unknown error occurred.'))
    })

  const states: State[] = await getAllStates(key)
  const state: State | undefined = states.find(state => state.key === key)

  if (state) return state
  throw new Error(`The "${key}" is not defined in states...`)
}

export const getPersistentState = async <S>(key: string): Promise<S> =>
  (await _getPersistentState(key)).state as S

export const setPersistentState = async <S>(
  key: string,
  value: S,
  subscribe?: () => void
): Promise<void> =>
  new Promise(async (resolve, reject) => {
    const { readonly, createdAt }: State = await _getPersistentState(key)
    if (readonly) throw new Error(`The "${key}" is readonly...`)

    const store: IDBObjectStore = await getStore(key, { mode: 'readwrite' })
    const request: IDBRequest<IDBValidKey> = store.put({
      state: value,
      key,
      readonly,
      createdAt,
      updatedAt: Date.now()
    })

    request.onsuccess = async () => (subscribe ? resolve(subscribe()) : resolve())
    throwError(request, reject)
  })

export const deletePersistentState = (key: string): Promise<void> =>
  new Promise(async (resolve, reject) => {
    const { id }: { id: number } = await _getPersistentState(key)
    const request = (await getStore(key, { mode: 'readwrite' })).delete(id)

    request.onsuccess = async () => resolve()
    throwError(request, reject)
  })

const _getSnapshot = async (state: string, key: string | number): Promise<Snapshot> => {
  const getAllSnapshots = (state: string): Promise<Snapshot[]> =>
    new Promise(async (resolve, reject) => {
      const store: IDBObjectStore = await getStore(state, {
        isSnapshot: true,
        mode: 'readonly'
      })

      const request: IDBRequest<Snapshot[]> = store.getAll()
      request.onsuccess = () => resolve(request.result)
      throwError(request, reject)
    })

  const snapshots: Snapshot[] = await getAllSnapshots(state)

  if (typeof key === 'string') {
    const snapshot: Snapshot | undefined = snapshots.find(snapshot => snapshot.name === key)

    if (snapshot) return snapshot
    throw new Error(`The "${key}" is not defined in snapshots...`)
  }

  return snapshots[key]
}

export const getSnapshot = async (state: string, key: string | number): Promise<unknown> =>
  _getSnapshot(state, key).then(snapshot => snapshot.state)

export const setSnapshot = (state: string, name?: string): Promise<void> =>
  new Promise(async (resolve, reject) => {
    const store: IDBObjectStore = await getStore(state, { isSnapshot: true, mode: 'readwrite' })
    const timestamp: number = Date.now()
    const value: Omit<Snapshot, 'id' | 'name'> = {
      state: getPersistentState(state),
      createdAt: timestamp,
      updatedAt: timestamp
    }
    const request: IDBRequest<IDBValidKey> = store.put(name ? { ...value, name } : value)

    request.onsuccess = async () => resolve()
    request.onerror = event => {
      const error: DOMException | null = (event.target as IDBRequest).error
      reject(error?.name === 'ConstraintError' ? new Error(`The ${name} already exists...`) : error)
    }
  })

export const deleteSnapshot = (state: string, key: string | number): Promise<void> =>
  new Promise(async (resolve, reject) => {
    const { id }: { id: number } = await _getSnapshot(state, key)
    const request = (await getStore(state, { isSnapshot: true, mode: 'readwrite' })).delete(id)

    request.onsuccess = async () => resolve()
    throwError(request, reject)
  })
