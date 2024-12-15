import { Task } from '@/types'

const storeName = 'tasks'
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('todo', 1)
    const getDBRequest = (event: Event): IDBOpenDBRequest => event.target as IDBOpenDBRequest

    request.onupgradeneeded = event => {
      const db: IDBDatabase = getDBRequest(event).result

      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
        store.createIndex('title', 'title', { unique: false })
        store.createIndex('description', 'description', { unique: false })
        store.createIndex('created_at', 'created_at', { unique: false })
        store.createIndex('completed_at', 'completed_at', { unique: false })
        store.createIndex('deleted_at', 'deleted_at', { unique: false })
      }
    }

    request.onsuccess = event => resolve(getDBRequest(event).result)
    request.onerror = event => reject(`Database error: ${getDBRequest(event).error}`)
  })
}

const getStore = async (mode: IDBTransactionMode): Promise<IDBObjectStore> => {
  try {
    return await openDB().then(db => db.transaction(storeName, mode).objectStore(storeName))
  } catch (error) {
    throw new Error(`${error}`)
  }
}

const throwError = (request: IDBRequest, reject: (error: Error | DOMException) => void): void => {
  request.onerror = () => reject(request.error ?? new Error('An unknown error occurred.'))
}

export const getAllTasks = async (): Promise<Task[]> => {
  const store = await getStore('readonly')

  return new Promise((resolve, reject) => {
    const request: IDBRequest<Task[]> = store.getAll()
    request.onsuccess = () => resolve(request.result)
    throwError(request, reject)
  })
}

export const addTask = async (title: string): Promise<Task[]> => {
  const store = await getStore('readwrite')

  return new Promise((resolve, reject) => {
    const request = store.add({
      title,
      description: '',
      created_at: Date.now(),
      updated_at: Date.now()
    })

    request.onsuccess = async () => resolve(await getAllTasks())
    throwError(request, reject)
  })
}

const getTask = async (id: number): Promise<Task> => {
  const store = await getStore('readonly')

  return new Promise((resolve, reject) => {
    const request: IDBRequest<Task> = store.get(id)

    request.onsuccess = () => {
      const task: Task = request.result

      if (task) resolve(task)
      reject(new Error(`Task with id:${id} is not found...`))
    }

    throwError(request, reject)
  })
}

export const updateTask = async ({
  id,
  title,
  description
}: {
  id: number
  title: string
  description: string
}): Promise<Task[]> => {
  const task = await getTask(id)
  task.title = title
  task.description = description

  const store = await getStore('readwrite')
  return new Promise((resolve, reject) => {
    const request = store.put(task)
    request.onsuccess = async () => resolve(await getAllTasks())
    throwError(request, reject)
  })
}

export const completeTask = async (id: number): Promise<Task[]> => {
  const task = await getTask(id)
  task.completed_at = Date.now()

  const store = await getStore('readwrite')
  return new Promise((resolve, reject) => {
    const request = store.put(task)
    request.onsuccess = async () => resolve(await getAllTasks())
    throwError(request, reject)
  })
}

export const revertTask = async (id: number): Promise<Task[]> => {
  const task = await getTask(id)
  task.completed_at = undefined

  const store = await getStore('readwrite')
  return new Promise((resolve, reject) => {
    const request = store.put(task)
    request.onsuccess = async () => resolve(await getAllTasks())
    throwError(request, reject)
  })
}

export const deleteTask = async (id: number): Promise<Task[]> => {
  const task = await getTask(id)
  const store = await getStore('readwrite')

  return new Promise((resolve, reject) => {
    const request = store.delete(task.id)
    request.onsuccess = async () => resolve(await getAllTasks())
    throwError(request, reject)
  })
}
