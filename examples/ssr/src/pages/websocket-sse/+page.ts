import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/websocket-sse/+spa'

export const meta = {
  title: 'WebSocket & SSE',
  description: 'This is an example of a WebSocket and a SSE with FiCsJS.'
}

const page: FiCsRouter.Page<Data> = ({ children: { chat } }) => chat

export default page
