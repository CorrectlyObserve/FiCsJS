import type { FiCsRouter } from 'ficsjs/router'
import { parseTaskPath } from '@/domain/path'
import type { Data } from '@/pages/+spa'
import { isExpanded } from '@/styles/theme'

const page: FiCsRouter.Page<Data> = ({ children: { TaskList, TaskDetails }, data, template }) => {
  if (parseTaskPath(data)) return isExpanded() ? template`${TaskList}${TaskDetails}` : TaskDetails
  return TaskList
}

export default page
