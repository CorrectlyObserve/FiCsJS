import { ficsRouter } from 'ficsjs/router'
import Chat from '@/components/Chat'
import { CHAT_PAGE } from '@/utils'
import { $userName } from '@/store'
import type { Message } from '@/types'

export default ficsRouter<{ messages: Message[]; logs: string[] }>({
  pathname: CHAT_PAGE,
  children: [Chat],
  data: () => ({ messages: [], logs: [] }),
  props: {
    descendant: ({ children: { chat } }) => chat,
    values: ({}) => ({
      messages: ({ getData }) => getData('messages'),
      sendMessage:
        ({ sendToWebsocket }) =>
        (message: Message) =>
          sendToWebsocket?.(JSON.stringify(message))
    })
  },
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
    websocket: {
      path: '/ws',
      onopen: ({ websocket: { send } }) => {
        const userName = $userName.get()

        if (userName !== '')
          send(JSON.stringify({ user: 'System', comment: `Hello, ${userName}!` }))
      },
      onmessage: ({ data: { messages }, setData, event: { data } }) =>
        setData('messages', [...messages, JSON.parse(data) as Message])
    },
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
