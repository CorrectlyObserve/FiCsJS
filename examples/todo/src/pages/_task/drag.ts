import type { Task } from '@/domain/task'

export type Direction = 'up' | 'down'

export interface Placement {
  task: Task
  after?: Task
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

export const isValidIndex = <T>({
  array,
  fromIndex,
  toIndex,
  isCopyMode
}: {
  array: readonly T[]
  fromIndex: number
  toIndex: number
  isCopyMode: boolean
}): boolean => {
  const isInvalidFromIndex =
    !Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex >= array.length

  if (isInvalidFromIndex || !Number.isInteger(toIndex)) return false

  return (
    toIndex >= 0 &&
    (isCopyMode ? toIndex <= array.length : toIndex < array.length && toIndex !== fromIndex)
  )
}
