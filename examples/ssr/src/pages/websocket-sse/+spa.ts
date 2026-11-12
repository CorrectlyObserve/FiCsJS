import type { FiCsRouter } from 'ficsjs/router'
import { flex, space } from 'ficsjs/style'
import Link from '@/components/Link'
import { toActivity } from '@/domain/activity'
import type { Message } from '@/domain/message'
import { paths } from '@/domain/path'
import Activities from '@/pages/websocket-sse/Activities'
import Chat from '@/pages/websocket-sse/Chat'
import Stream from '@/pages/websocket-sse/Stream'

export interface Data {
  readonly userName: string
  messages: readonly Message[]
  activities: readonly string[]
}

const props: FiCsRouter.Props<Data> = [
  {
    descendants: ({ children: { chat } }) => chat,
    values: ({ data: { userName, messages }, sendToWebsocket }) => ({
      userName,
      messages,
      sendMessage: (message: Message) => sendToWebsocket(JSON.stringify(message))
    })
  },
  {
    descendants: ({ children: { activities } }) => activities,
    values: ({ data: { activities } }) => ({ activities })
  }
]

const css: FiCsRouter.Css<Data> = `
  nav {
    ${flex({ center: 'xy', gap: space('md') })}
    flex-wrap: wrap;
    margin-block-end: ${space('md')};
  }
`

const options: FiCsRouter.Options<Data> = {
  websocket: {
    path: paths.api.WS,
    onopen: ({ data: { userName }, websocket: { send } }) => {
      if (userName === '') return
      send(JSON.stringify({ userName }))
    },
    onmessage: ({ data, event: { data: messageData } }) => {
      let message: Partial<Message>
      try {
        message = JSON.parse(messageData)
      } catch {
        return
      }

      const { userName, comment }: Partial<Message> = message
      if (userName && comment) data.messages = [...data.messages, { userName, comment }]
    }
  },
  sse: {
    path: paths.api.LOG,
    onopen: ({ data }) =>
      (data.activities = [...data.activities, toActivity(`${data.userName} joined the chat.`)]),
    actions: {
      log: ({ data, event: { data: log } }) => (data.activities = [...data.activities, log])
    }
  }
}

const spa: FiCsRouter.Spa<Data> = {
  pathname: paths.WS_SSE,
  children: [Link(), Chat, Activities, Stream],
  data: () => ({ userName: '', messages: [], activities: [] }),
  props,
  css,
  options
}

export default spa
