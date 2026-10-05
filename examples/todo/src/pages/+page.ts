import type { FiCsRouter } from 'ficsjs/router'
import { parseTaskPath } from '@/domain/path'
import type { Data } from '@/pages/+spa'
import { measureOffsetWidth } from '@/utils/style'

const page: FiCsRouter.Page<Data> = ({ children: { tasks, taskDetails }, data, template }) => {
  if (parseTaskPath(data))
    return measureOffsetWidth() ? template`${tasks}${taskDetails}` : taskDetails
  return tasks
}

export default page
