import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/websocket-sse/+spa'

const page: FiCsRouter.Page<Data> = ({ data: { activities }, template }) => template`
  <section>
    <h3>Activities</h3>
    <div>${activities.map((activity, index) => template`<p key="${index}">${activity}</p>`)}</div>
  </section>
`

export default page
