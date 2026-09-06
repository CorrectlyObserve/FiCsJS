import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/+spa'
import { measureOffsetWidth } from '@/utils/others'

const page: FiCsRouter.Page<Data> = ({
  children: { tasks, taskDetails },
  data: {
    queries: { taskId }
  },
  template
}) => {
  if (taskId) return measureOffsetWidth() ? template`${tasks}${taskDetails}` : taskDetails
  return tasks
}

export default page
