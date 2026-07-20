import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/+spa.config'
import { measureOffsetWidth } from '@/utils/others'

const page: FiCsRouter.Page<Data> = ({
  children: { tasks, taskDetails, notFound },
  data: {
    isNotFound,
    queries: { taskId }
  },
  template
}) => {
  if (isNotFound) return notFound
  if (taskId) return measureOffsetWidth() ? template`${tasks}${taskDetails}` : taskDetails
  return tasks
}

export default page
