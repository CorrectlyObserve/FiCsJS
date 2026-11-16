import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/websocket-sse/+spa'

const page: FiCsRouter.Page<Data> = ({ children: { Activities } }) => Activities

export default page
