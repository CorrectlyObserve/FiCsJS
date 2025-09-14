import { ficsRouter } from 'ficsjs/router'
import Chat from '@/components/Chat'
import { CHAT_PAGE } from '@/utils'

export default ficsRouter<{ logs: string[] }>({
  pathname: CHAT_PAGE,
  children: [Chat],
  data: () => ({ logs: [] }),
  pages: [
    { path: CHAT_PAGE, content: ({ children: { chat } }) => chat },
    {
      path: `${CHAT_PAGE}/logs`,
      content: ({ data: { logs }, template }) => template`
        <h2 class="text-lg text-white text-center">Logs</h2>
        ${logs.map(log => template`<p class="text-white mb-2">${log}</p>`)}
      `
    }
  ],
  css: { ':host p.mb-2:last-child': { 'margin-bottom': '0' } },
  options: {
    sse: {
      path: '/sse',
      onopen: ({ setData }) => setData('logs', ['The server is connected.']),
      actions: {
        'time-update': ({ data: { logs }, setData, event: { data } }) =>
          setData('logs', [...logs, data])
      }
    }
  }
})
