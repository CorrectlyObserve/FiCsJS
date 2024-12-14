import { createState } from 'ficsjs/state'
import { Task } from '@/types'

export const $lang = createState<string>('en')
export const $tasks = createState<Task[]>([])
