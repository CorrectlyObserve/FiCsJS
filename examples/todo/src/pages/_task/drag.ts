import type { Task } from '@/domain/task'

export type Direction = 'up' | 'down'

export interface Insertion {
  taskId: Task['id']
  targetId?: Task['id']
}

export interface ReorderLabels {
  handle: string
  up: string
  down: string
  copy: string
  moved: string
  cloned: string
}

export const MENU_ID = 'drag-menu' as const

export const getDropZoneIndex = ({
  fromIndex,
  zoneIndex,
  isCopyMode
}: {
  fromIndex: number
  zoneIndex: number
  isCopyMode: boolean
}): number => {
  if (isCopyMode) return zoneIndex + 1
  return fromIndex > zoneIndex ? zoneIndex + 1 : zoneIndex
}

export const getInsertion = ({
  tasks,
  fromIndex,
  toIndex,
  isCopyMode
}: {
  tasks: readonly Task[]
  fromIndex: number
  toIndex: number
  isCopyMode: boolean
}): Insertion | undefined => {
  if (!isValidIndex({ tasks, fromIndex, toIndex, isCopyMode })) return undefined

  const remainingTasks: readonly Task[] = isCopyMode
    ? tasks
    : tasks.filter((_, index) => index !== fromIndex)

  return {
    taskId: tasks[fromIndex].id,
    targetId: toIndex === 0 ? undefined : remainingTasks[toIndex - 1]?.id
  }
}

export const getToIndex = ({
  fromIndex,
  isDown,
  isCopyMode
}: {
  fromIndex: number
  isDown: boolean
  isCopyMode: boolean
}): number => {
  if (isDown) return fromIndex + 1
  return isCopyMode ? fromIndex : fromIndex - 1
}

export const isValidIndex = ({
  tasks,
  fromIndex,
  toIndex,
  isCopyMode
}: {
  tasks: readonly Task[]
  fromIndex: number
  toIndex: number
  isCopyMode: boolean
}): boolean => {
  const { length } = tasks
  const isInvalidFromIndex = !Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex >= length

  if (isInvalidFromIndex || !Number.isInteger(toIndex)) return false

  return (
    toIndex >= 0 && (isCopyMode ? toIndex <= length : toIndex < length && toIndex !== fromIndex)
  )
}
