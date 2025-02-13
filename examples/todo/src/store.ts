import { createState } from 'ficsjs/state'

export const $lang = createState<string>('en')
export const $taskId = createState<number>(0)
