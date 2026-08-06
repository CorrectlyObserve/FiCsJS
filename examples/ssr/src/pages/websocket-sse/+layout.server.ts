import type { FiCsRouter } from 'ficsjs/router'
import Link from '@/components/Link'
import Tab from '@/pages/websocket-sse/Tab'

const layout: FiCsRouter.SsrLayout<{}> = ({ slot }) => `
  ${Link.toString({ data: { href: '/', text: 'Back to the top page' } })}
  ${Tab.toString()}
  ${slot}
`

export default layout
