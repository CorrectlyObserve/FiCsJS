import type { FiCsRouter } from 'ficsjs/router'
import type { Data } from '@/pages/websocket-sse/+spa.config'

const page: FiCsRouter.Page<Data> = ({ data: { activities }, template }) => template`
  <h2 class="text-lg text-white text-center mb-6">Activities</h2>
  <div class="w-fit mx-auto">
    ${activities.map(activity => template`<p class="text-white mb-4">${activity}</p>`)}
  </div>
`

export default page
