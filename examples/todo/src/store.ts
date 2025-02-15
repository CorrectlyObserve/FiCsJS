import {
  createPersistentState,
  getPersistentState,
  setPersistentState
} from 'ficsjs/persistent-state'
import { createState } from 'ficsjs/state'
import { Task } from '@/types'
import { getTimestamp, generator } from '@/utils'

export const $lang = createState<string>('en')
export const $tasks = await createPersistentState<Task[]>([])

export const addTask = async (title: string): Promise<Task[]> => {
  try {
    const tasks: Task[] = await getPersistentState<Task[]>($tasks)
    const timestamp: number = getTimestamp()
    const newTask: Task = {
      id: generator.next().value,
      title,
      description: '',
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: undefined
    }

    tasks.push(newTask)
    await setPersistentState<Task[]>($tasks, tasks)
    return tasks
  } catch (error) {
    throw new Error((error as Error).message)
  }
}

export const getTask = async (tasks: Task[], id: number): Promise<Task | undefined> =>
  tasks.find(task => task.id === id)

export const updateTask = async ({
  id,
  title,
  description
}: {
  id: number
  title: string
  description: string
}): Promise<Task[]> => {
  try {
    const tasks: Task[] = await getPersistentState<Task[]>($tasks)
    const task: Task | undefined = await getTask(tasks, id)

    if (!task) throw new Error(`The task with id:${id} is not found...`)

    task.title = title
    task.description = description
    task.updatedAt = getTimestamp()

    await setPersistentState<Task[]>($tasks, tasks)
    return tasks
  } catch (error) {
    throw new Error(`Failed to update task: ${(error as Error).message}`)
  }
}

export const completeTask = async (id: number): Promise<Task[]> => {
  try {
    const tasks: Task[] = await getPersistentState<Task[]>($tasks)
    const task: Task | undefined = await getTask(tasks, id)

    if (!task) throw new Error(`The task with id:${id} is not found...`)

    const timestamp: number = getTimestamp()
    task.updatedAt = timestamp
    task.completedAt = timestamp

    await setPersistentState<Task[]>($tasks, tasks)
    return tasks
  } catch (error) {
    throw new Error((error as Error).message)
  }
}

export const revertTask = async (id: number): Promise<Task[]> => {
  try {
    const tasks: Task[] = await getPersistentState<Task[]>($tasks)
    const task: Task | undefined = await getTask(tasks, id)

    if(!task) throw new Error(`The task with id:${id} is not found...`)

    task.updatedAt = getTimestamp()
    task.completedAt = undefined

    await setPersistentState<Task[]>($tasks, tasks)
    return tasks
  } catch (error) {
    throw new Error((error as Error).message)
  }
}

export const deleteTask = async (id: number): Promise<Task[]> => {
  try {
    const tasks: Task[] = await getPersistentState<Task[]>($tasks)
    const taskIndex = tasks.findIndex(task => task.id === id)

    if (taskIndex === -1) throw new Error(`The task with id:${id} is not found...`)

    tasks.splice(taskIndex, 1)
    await setPersistentState<Task[]>($tasks, tasks)
    return tasks
  } catch (error) {
    throw new Error((error as Error).message)
  }
}
