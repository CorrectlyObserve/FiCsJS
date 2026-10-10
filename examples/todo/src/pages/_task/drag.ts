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