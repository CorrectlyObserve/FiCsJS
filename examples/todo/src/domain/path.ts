import type { FiCsRouter } from 'ficsjs/router'

export interface TaskPath {
  id: number
  isQueryParam: boolean
}

const TASK_ID = 'taskId' as const

export const createTaskPath = ({ id, isQueryParam }: TaskPath): string =>
  '/' + (isQueryParam ? `?${TASK_ID}=${id}` : id)

export const parseTaskPath = ({
  pathname,
  queries
}: Pick<FiCsRouter.DefaultData, 'pathname' | 'queries'>): TaskPath | null => {
  const segment: string = pathname.replace(/^\//, ''),
    isQueryParam: boolean = segment === '',
    raw: string = isQueryParam ? (queries[TASK_ID] ?? '') : segment

  if (raw === '') return null
  return { id: /^\d+$/.test(raw) ? Number(raw) : NaN, isQueryParam }
}
