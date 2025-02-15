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
              keyPath: 'id'
            })
            store.createIndex('state', 'state', { unique: false })

            if (isSnapshot) store.createIndex('name', 'name', { unique: true })
            else store.createIndex('readonly', 'readonly', { unique: false })

            store.createIndex('createdAt', 'createdAt', { unique: false })
            store.createIndex('updatedAt', 'updatedAt', { unique: false })
          }
        }

        request.onsuccess = event => resolve(getDBRequest(event).result)
        request.onerror = event => reject(`Database error: ${getDBRequest(event).error}`)
      })

    return await openDB().then(db => db.transaction(storeName, mode).objectStore(storeName))
  } catch (error) {
    throw new Error(`${error}`)
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
    const id: string = `fics-state-${generator.next().value}`
    const store: IDBObjectStore = await getStore('states', { mode: 'readwrite' })

    const getRequest: IDBRequest<S> = store.get(id)
    getRequest.onsuccess = () => {
      if (getRequest.result) resolve(id)
      else {
        const timestamp: number = Date.now()
        const request: IDBRequest<IDBValidKey> = store.add({
          id,
          state: value,
          readonly: options?.readonly === true,
          createdAt: timestamp,
          updatedAt: timestamp
        })

        request.onsuccess = async () => resolve(id)
        throwError(request, reject)
      }
    }
  })

const _getPersistentState = async <S>(id: string): Promise<S> => {
  const getAllStates = async (): Promise<State<S>[]> =>
    new Promise(async (resolve, reject) => {
      const store: IDBObjectStore = await getStore('states', { mode: 'readonly' })
      const request: IDBRequest<State<S>[]> = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('An unknown error occurred.'))
    })

  const states: State<S>[] = await getAllStates()
  const stateObj: State<S> | undefined = states.find(stateObj => stateObj.id === id)

  if (stateObj) return stateObj.state
  throw new Error(`The "${id}" is not defined in states...`)
}

export const getPersistentState = async <S>(key: string): Promise<S> =>
  (await _getPersistentState(key)) as S

export const setPersistentState = async <S>(
  id: string,
  value: S,
  subscribe?: () => void
): Promise<void> =>
  new Promise(async (resolve, reject) => {
    const { readonly, createdAt }: State<S> = await _getPersistentState(id)
    if (readonly) throw new Error(`The "${id}" is readonly...`)

    const store: IDBObjectStore = await getStore('states', { mode: 'readwrite' })
    const request: IDBRequest<IDBValidKey> = store.put({
      id,
      state: value,
      readonly,
      createdAt,
      updatedAt: Date.now()
    })

    request.onsuccess = async () => (subscribe ? resolve(subscribe()) : resolve())
    throwError(request, reject)
  })

export const deletePersistentState = (id: string): Promise<void> =>
  new Promise(async (resolve, reject) => {
    const { id: _id }: { id: string } = await _getPersistentState(id)
    const request = (await getStore('states', { mode: 'readwrite' })).delete(_id)

    request.onsuccess = async () => resolve()
    throwError(request, reject)
  })

const _getSnapshot = async <S>(state: string, key: string | number): Promise<Snapshot<S>> => {
  const getAllSnapshots = (state: string): Promise<Snapshot<S>[]> =>
    new Promise(async (resolve, reject) => {
      const store: IDBObjectStore = await getStore(state, {
        isSnapshot: true,
        mode: 'readonly'
      })

      const request: IDBRequest<Snapshot<S>[]> = store.getAll()
      request.onsuccess = () => resolve(request.result)
      throwError(request, reject)
    })

  const snapshots: Snapshot<S>[] = await getAllSnapshots(state)

  if (typeof key === 'string') {
    const snapshot: Snapshot<S> | undefined = snapshots.find(snapshot => snapshot.name === key)

    if (snapshot) return snapshot
    throw new Error(`The "${key}" is not defined in snapshots...`)
  }

  return snapshots[key]
}

export const getSnapshot = async (state: string, key: string | number): Promise<unknown> =>
  _getSnapshot(state, key).then(snapshot => snapshot.state)

export const setSnapshot = <S>(state: string, name?: string): Promise<void> =>
  new Promise(async (resolve, reject) => {
    const store: IDBObjectStore = await getStore(state, { isSnapshot: true, mode: 'readwrite' })
    const timestamp: number = Date.now()
    const value: Omit<Snapshot<S>, 'id' | 'name'> = {
      state: await getPersistentState<S>(state),
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
