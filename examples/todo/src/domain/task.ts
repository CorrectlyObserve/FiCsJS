import { createPersistentState } from 'ficsjs/persistent-state'
import { getTimestamp } from '@/domain/timestamp'

export interface Task {
  id: number
  title: string
  description: string
  createdAt: number
  updatedAt: number
  completedAt?: number
}

export const $tasks = createPersistentState<Task[]>({ stateId: 'tasks', state: [] })

let setQueue: Promise<Task[]> = Promise.resolve([])
const enqueue = (task: () => Promise<Task[]>): Promise<Task[]> => {
  setQueue = setQueue.then(task, error => {
    throw error
  })
  return setQueue
}

const mutateTasks = async (mutate: (tasks: Task[], timestamp: number) => void): Promise<Task[]> => {
  const tasks: Task[] = [...(await getAllTasks())]

  mutate(tasks, getTimestamp())
  await $tasks.set(tasks)
  return tasks
}
const mutateTask = (id: number, mutate: (task: Task, timestamp: number) => void): Promise<Task[]> =>
  mutateTasks((tasks, timestamp) => {
    const task: Task | undefined = getTask(tasks, id)

    if (!task) throw new Error(`The task with ID ${id} was not found...`)
    mutate(task, timestamp)
  })

export const findNextIndex = (tasks: Task[], targetId?: number): number => {
  if (targetId === undefined) return 0

  const index = tasks.findIndex(task => task.id === targetId)
  return index === -1 ? tasks.length : index + 1
}

export const getAllTasks = async (): Promise<Task[]> => await $tasks.get()

export const addTask = async (title: string): Promise<Task[]> =>
  enqueue(() =>
    mutateTasks((tasks, timestamp) =>
      tasks.push({
        id: timestamp,
        title,
        description: '',
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: undefined
      })
    )
  )

export const getTask = (tasks: Task[], id: number): Task | undefined =>
  tasks.find(task => task.id === id)

export const getIncompleteTasks = (tasks: Task[]): Task[] =>
  tasks.filter(({ completedAt }) => !completedAt)

export const updateTask = async ({
  id,
  title,
  description,
  completedAt
}: Omit<Task, 'createdAt' | 'updatedAt'>): Promise<Task[]> =>
  enqueue(() =>
    mutateTask(id, (task, timestamp) => {
      task.title = title
      task.description = description
      task.updatedAt = timestamp
      task.completedAt = completedAt ? timestamp : undefined
    })
  )

export const reorderTasks = async (id: number, targetId?: number): Promise<Task[]> =>
  enqueue(() =>
    mutateTasks(tasks => {
      const fromIndex = tasks.findIndex(task => task.id === id)
      if (fromIndex === -1) throw new Error(`The task with ID ${id} was not found...`)

      const [task] = tasks.splice(fromIndex, 1)
      tasks.splice(findNextIndex(tasks, targetId), 0, task)
    })
  )

export const cloneTask = async ({
  id,
  copiedTitle,
  targetId
}: {
  id: number
  copiedTitle: (values: Record<string, string | number>) => string
  targetId?: number
}): Promise<Task[]> =>
  enqueue(() =>
    mutateTasks((tasks, timestamp) => {
      const task: Task | undefined = getTask(tasks, id)
      if (!task) throw new Error(`The task with ID ${id} was not found...`)

      tasks.splice(findNextIndex(tasks, targetId), 0, {
        ...task,
        id: timestamp,
        title: copiedTitle({ title: task.title }),
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: undefined
      })
    })
  )

export const completeTask = async (id: number): Promise<Task[]> =>
  enqueue(() =>
    mutateTask(id, (task, timestamp) => {
      task.updatedAt = timestamp
      task.completedAt = timestamp
    })
  )

export const revertTask = async (id: number): Promise<Task[]> =>
  enqueue(() =>
    mutateTask(id, (task, timestamp) => {
      task.updatedAt = timestamp
      task.completedAt = undefined
    })
  )

export const deleteTask = async (id: number): Promise<Task[]> =>
  enqueue(() =>
    mutateTasks(tasks => {
      const taskIndex = tasks.findIndex(task => task.id === id)
      if (taskIndex === -1) throw new Error(`The task with ID ${id} was not found...`)
      tasks.splice(taskIndex, 1)
    })
  )
