import { ficsRouter } from 'ficsjs/router'
import Chat from '@/pages/websocket-sse/_components/Chat'
import Stream from '@/pages/websocket-sse/_components/Stream'
import { $userName } from '@/stores'
import type { Message } from '@/types'
import { API_PATHS, CHAT_PAGE, getTimestamp } from '@/utils'

export default ficsRouter<{ messages: Message[]; logs: string[] }>({
  pathname: CHAT_PAGE,
  children: [Chat, Stream],
  data: () => ({ messages: [], logs: [] }),
  props: {
    descendant: ({ children: { chat } }) => chat,
    values: ({ data: { messages }, sendToWebsocket }) => ({
      messages,
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
    },
    { path: `${CHAT_PAGE}/stream`, content: ({ children: { stream } }) => stream }
  ],
  css: `
    div {
      max-width: var(--chat-width);

      p:last-child { margin-bottom: 0; }
    }
  `,
  options: {
    websocket: {
      path: API_PATHS.ws,
      onopen: ({ websocket: { send } }) => {
        const userName = $userName.get()
        if (userName === '') return

        send(JSON.stringify({ userName }))
      },
      onmessage: ({ data, event: { data: messageData } }) => {
        const { userName, comment }: Message = JSON.parse(messageData)
        if (userName && comment) data.messages = [...data.messages, { userName, comment }]
      }
    },
    sse: {
      path: API_PATHS.log,
      onopen: ({ data }) =>
        (data.logs = [`${getTimestamp()}: ${$userName.get()} joined the chat.`]),
      actions: { log: ({ data, event: { data: logs } }) => (data.logs = [...data.logs, logs]) }
    }
  }
})
