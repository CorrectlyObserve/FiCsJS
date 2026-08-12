import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/+spa.config'

const page: FiCsRouter.Page<Data> = ({
  children: { taskDetails, notFound },
  data: { isNotFound }
}) => (isNotFound ? notFound : taskDetails)

export default page
