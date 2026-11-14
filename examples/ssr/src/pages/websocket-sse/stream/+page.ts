import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/websocket-sse/+spa'

const page: FiCsRouter.Page<Data> = ({ children: { Stream } }) => Stream

export default page
