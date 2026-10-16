import type { FiCsRouter } from 'ficsjs/router'
import { parseTaskPath } from '@/domain/path'
import type { Data } from '@/pages/+spa'
import { isExpanded } from '@/styles/theme'

const page: FiCsRouter.Page<Data> = ({ children: { taskList, taskDetails }, data, template }) => {
  if (parseTaskPath(data)) return isExpanded() ? template`${taskList}${taskDetails}` : taskDetails
  return taskList
}

export default page
