import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/+spa'

const page: FiCsRouter.Page<Data> = ({ children: { TaskDetails } }) => TaskDetails

export default page
