import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/websocket-sse/+spa.config'

const page: FiCsRouter.Page<Data> = ({ children: { stream } }) => stream
export default page
