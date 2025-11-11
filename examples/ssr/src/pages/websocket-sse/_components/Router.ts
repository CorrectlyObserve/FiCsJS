import { ficsRouter } from 'ficsjs/router'
import { cssVar } from 'ficsjs/style'
import Chat from '@/pages/websocket-sse/_components/Chat'
import { $userName } from '@/store'
import type { Message } from '@/types'
import { CHAT_PAGE, getTimestamp, WEBSOCKET_PATH } from '@/utils'

export default ficsRouter<{ messages: Message[]; logs: string[] }>({
  pathname: CHAT_PAGE,
  children: [Chat],
  data: () => ({ messages: [], logs: [] }),
  props: {
    descendant: ({ children: { chat } }) => chat,
    values: ({ sendToWebsocket }) => ({
      messages: ({ getData }) => getData('messages'),
      sendMessage: (message: Message) => sendToWebsocket(JSON.stringify(message))
    })
  },
  pages: [
    { path: CHAT_PAGE, content: ({ children: { chat } }) => chat },
    {
      path: `${CHAT_PAGE}/logs`,
      content: ({ data: { logs }, template }) => template`
        <h2 class="text-lg text-white text-center mb-6">Logs</h2>
        <div class="w-fit mx-auto">
          ${logs.map(log => template`<p class="text-white mb-4">${log}</p>`)}
        </div>
      `
    }
  ],
  css: {
    ':host div': { maxWidth: cssVar('chat-width'), 'p:last-child': { 'margin-bottom': '0' } }
  },
  options: {
    websocket: {
      path: WEBSOCKET_PATH,
      onopen: ({ websocket: { send } }) => {
        const userName = $userName.get()
        if (userName === '') return

        send(JSON.stringify({ userName }))
      },
      onmessage: ({ data: { messages }, setData, event: { data } }) => {
        const { userName, comment }: Message = JSON.parse(data)
        if (userName && comment) setData('messages', [...messages, { userName, comment }])
      }
    },
    sse: {
      path: '/sse',
      onopen: ({ setData }) =>
        setData('logs', [`${getTimestamp()}: ${$userName.get()} joined the chat.`]),
      actions: {
        log: ({ data: { logs }, setData, event: { data } }) => setData('logs', [...logs, data])
      }
    }
  }
})
