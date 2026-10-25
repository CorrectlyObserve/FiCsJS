import type { FiCsRouter } from 'ficsjs/router'
import { pages } from '@/domain/path'
import type { Data } from '@/pages/websocket-sse/+spa'

const { CHAT, ACTIVITIES, STREAM } = pages
const layout: FiCsRouter.Layout<Data> = ({
  data: { pathname },
  children: { link },
  slot,
  template
}) => template`
  <nav aria-label="Chat sections">
    ${[CHAT, ACTIVITIES, STREAM].map(({ href, name }) =>
      link.setIndividualProps(href, { href, text: name, isCurrent: pathname === href })
    )}
  </nav>
  ${slot}
`

export default layout
