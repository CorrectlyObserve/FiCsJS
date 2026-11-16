import type { FiCsRouter } from 'ficsjs/router'

export interface TaskPath {
  id: number
  isQueryParam: boolean
}

const TASK_ID = 'taskId' as const

export const createTaskPath = ({ id, isQueryParam }: TaskPath): string =>
  '/' + (isQueryParam ? `?${TASK_ID}=${id}` : id)

export const parseTaskPath = ({
  dynamicParams,
  queries
}: Pick<FiCsRouter.DefaultData, 'dynamicParams' | 'queries'>): TaskPath | null => {
  const raw: string = dynamicParams[TASK_ID] ?? queries[TASK_ID] ?? ''

  if (raw === '') return null
  return {
    id: /^\d+$/.test(raw) ? Number(raw) : NaN,
    isQueryParam: dynamicParams[TASK_ID] === undefined
  }
}
