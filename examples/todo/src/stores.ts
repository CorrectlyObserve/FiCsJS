import createPersistentState from 'ficsjs/persistent-state'
import createState from 'ficsjs/state'
import { Lang, Task } from '@/types'
import { getTimestamp } from '@/utils/others'

export const $lang = createState<Lang>('en')
export const $tasks = createPersistentState<Task[]>([])

export const getAllTasks = async (): Promise<Task[]> => await $tasks.get()

export const addTask = async (title: string): Promise<Task[]> => {
  try {
    const tasks: Task[] = await getAllTasks(),
      timestamp: number = getTimestamp(),
      newTask: Task = {
        id: timestamp,
        title,
        description: '',
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: undefined
      }

    tasks.push(newTask)
    await $tasks.set(tasks)
    return tasks
  } catch (error) {
    throw new Error((error as Error).message)
  }
}

export const getTask = async (tasks: Task[], id: number): Promise<Task | undefined> =>
  tasks.find(task => task.id === id)

const searchTask = async (tasks: Task[], id: number): Promise<Task> => {
  const task: Task | undefined = await getTask(tasks, id)

  if (!task) throw new Error(`The task with id:${id} is not found...`)
  return task
}

export const updateTask = async ({
  id,
  title,
  description,
  completedAt
}: {
  id: number
  title: string
  description: string
  completedAt: number | undefined
}): Promise<Task[]> => {
  try {
    const tasks: Task[] = await getAllTasks(),
      task: Task | undefined = await searchTask(tasks, id),
      timestamp: number = getTimestamp()

    task.title = title
    task.description = description
    task.updatedAt = timestamp
    task.completedAt = completedAt ? timestamp : undefined

    await $tasks.set(tasks)
    return tasks
  } catch (error) {
    throw new Error((error as Error).message)
  }
}

export const completeTask = async (id: number): Promise<Task[]> => {
  try {
    const tasks: Task[] = await getAllTasks(),
      task: Task | undefined = await searchTask(tasks, id),
      timestamp: number = getTimestamp()

    task.updatedAt = timestamp
    task.completedAt = timestamp

    await $tasks.set(tasks)
    return tasks
  } catch (error) {
    throw new Error((error as Error).message)
  }
}

export const revertTask = async (id: number): Promise<Task[]> => {
  try {
    const tasks: Task[] = await getAllTasks(),
      task: Task | undefined = await searchTask(tasks, id)

    task.updatedAt = getTimestamp()
    task.completedAt = undefined

    await $tasks.set(tasks)
    return tasks
  } catch (error) {
    throw new Error((error as Error).message)
  }
}

export const deleteTask = async (id: number): Promise<Task[]> => {
  try {
    const tasks: Task[] = await getAllTasks(),
      taskIndex = tasks.findIndex(task => task.id === id)

    if (taskIndex === -1) throw new Error(`The task with id:${id} is not found...`)

    tasks.splice(taskIndex, 1)
    await $tasks.set(tasks)
    return tasks
  } catch (error) {
    throw new Error((error as Error).message)
  }
}
