import type { FiCsRouter } from 'ficsjs/router'
import Chat from '@/pages/websocket-sse/Chat'
import Stream from '@/pages/websocket-sse/Stream'
import { $userName } from '@/stores'
import type { Message } from '@/types'
import { API_PATHS, CHAT_PAGE, getTimestamp } from '@/utils'

export interface Data {
  messages: Message[]
  activities: string[]
}

const props: FiCsRouter.Props<Data> = {
  descendants: ({ children: { chat } }) => chat,
  values: ({ data: { messages }, sendToWebsocket }) => ({
    messages,
    sendMessage: (message: Message) => sendToWebsocket(JSON.stringify(message))
  })
}

const css: FiCsRouter.Css<Data> = `
  :host > div {
    max-width: var(--chat-width);

    p:last-child { margin-bottom: 0; }
  }
`

const options: FiCsRouter.Options<Data> = {
  ssr: true,
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
      (data.activities = [`${getTimestamp()}: ${$userName.get()} joined the chat.`]),
    actions: {
      log: ({ data, event: { data: log } }) => (data.activities = [...data.activities, log])
    }
  }
}

const spa: FiCsRouter.Spa<Data> = {
  pathname: CHAT_PAGE,
  children: [Chat, Stream],
  data: () => ({ messages: [], activities: [] }),
  props,
  css,
  options
}

export default spa
