import { createPersistentState } from 'ficsjs/persistent-state'
import { createState } from 'ficsjs/state'
import { Lang, Task } from '@/types'
import { getTimestamp } from '@/utils/others'

export const $lang = createState<Lang>('en', { sessionStorage: 'lang' })
export const $tasks = createPersistentState<Task[]>({ stateId: 'tasks', state: [] })

let setQueue: Promise<Task[]> = Promise.resolve([])
const enqueue = (task: () => Promise<Task[]>): Promise<Task[]> => {
    setQueue = setQueue.then(task, error => {
      throw error
    })
    return setQueue
  },
  mutateTasks = async (mutate: (tasks: Task[], timestamp: number) => void): Promise<Task[]> => {
    const tasks: Task[] = [...(await getAllTasks())]

    mutate(tasks, getTimestamp())
    await $tasks.set(tasks)
    return tasks
  },
  mutateTask = (id: number, mutate: (task: Task, timestamp: number) => void): Promise<Task[]> =>
    mutateTasks((tasks, timestamp) => {
      const task: Task | undefined = getTask(tasks, id)

      if (!task) throw new Error(`The task with ID ${id} was not found...`)
      mutate(task, timestamp)
    })

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
