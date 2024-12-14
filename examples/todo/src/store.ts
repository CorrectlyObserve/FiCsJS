import { createState } from 'ficsjs/state'
import { Task, TaskQueue } from '@/types'

export const $lang = createState<string>('en')
export const $tasks = createState<Task[]>([])
export const $taskQueue = createState<TaskQueue>({} as TaskQueue)
