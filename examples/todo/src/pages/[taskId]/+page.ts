import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/components/Router'

const page: FiCsRouter.Page<Data> = ({ children: { taskDetails } }) => taskDetails

export default page
