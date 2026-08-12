import type { FiCsRouter } from 'ficsjs/router'
import Link from '@/components/Link'
import Tab from '@/pages/websocket-sse/Tab'

const layout: FiCsRouter.SsrLayout<{}> = ({ slot }) => `
  ${Link.toString()}
  ${Tab.toString()}
  ${slot}
`

export default layout
