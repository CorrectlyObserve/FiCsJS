import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { createBunWebSocket, serveStatic } from 'hono/bun'
import type { ServerWebSocket } from 'bun'
import Link from './src/components/Link'
import Users from './src/components/index/Users'
import ChatButton from './src/components/ChatButton'
import Photos from './src/components/scroll/Photos'
import Tab from './src/components/websocket-sse/Tab'
import Router from './src/components/websocket-sse/Router'
import { SSEMessage, Message } from './src/types'
import { CHAT_PAGE, getTimestamp, WEBSOCKET_PATH } from './src/utils'

const app = new Hono()

app.get('/dist/*', serveStatic({ root: './' }))

const template = ({
  title,
  description,
  content,
  path
}: {
  title: string
  description: string
  content: string
  path: string
}): string =>
  `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <meta name="description" content="${description}" />
        <link rel="stylesheet" type="text/css" href="/dist/global.css" />
      </head>
      <body class="bg-dark px-4">
        <header class="py-2"><h1 class="text-xl text-center font-semibold">${title}</h1></header>
        <main class="pb-8">${content}</main>
        <footer class="text-sm text-white text-center pb-4"><p>&copy; 2025 Masami Ogasawara</p></footer>
        <script type="module" src="/dist/${path.replace(/^\/+/, '')}.js"></script>
      </body>
    </html>
  `

const link = Link()
const chatButton = ChatButton()
app.get('/', c =>
  c.html(
    template({
      title: 'FiCsJS with Hono',
      description: 'This is a simple example of FiCsJS with Hono in SSR.',
      content: `
        ${link.toString({ href: '/scroll', text: 'Go to the scroll page' })}
        ${Users.toString()}
        ${chatButton.toString()}
      `,
      path: '/index'
    })
  )
)

app.get('/scroll', c =>
  c.html(
    template({
      title: 'Infinite and virtual scroll',
      description:
        'This is a simple example of an infinite scroll and a virtual scroll with FiCsJS.',
      content: `
        ${link.toString({ href: '/', text: 'Back to the top page' })}
        ${Photos.toString()}
        ${chatButton.toString()}
      `,
      path: '/scroll'
    })
  )
)

app.get(CHAT_PAGE, c =>
  c.html(
    template({
      title: 'WebSocket and SSE',
      description: 'This is a simple example of a WebSocket and an SSE with FiCsJS.',
      content: `
        ${link.toString({ href: '/', text: 'Back to the top page' })}
        ${Tab.toString()}
        ${Router.toString()}
      `,
      path: CHAT_PAGE
    })
  )
)

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>(),
  createServerMessage = (comment: string): string =>
    JSON.stringify({ userName: 'Server', comment }),
  createSseMessage = (message: string): SSEMessage => ({
    event: 'log',
    data: `${getTimestamp()}: ${message}`
  }),
  messages: Message[] = [],
  wsClients = new Set<ServerWebSocket>(),
  wsClientUsernames = new Map<ServerWebSocket, string>(),
  broadcastMessage = (message: string): void => {
    for (const client of wsClients)
      try {
        client.send(message)
      } catch {
        wsClients.delete(client)
      }
  },
  sseClients = new Set<(sseMessage: SSEMessage) => Promise<void>>(),
  pendingSseMessages: SSEMessage[] = []

app.get(
  WEBSOCKET_PATH,
  upgradeWebSocket(() => ({
    onOpen(_event, { raw }): void {
      if (raw) wsClients.add(raw)
    },
    onMessage({ data }, ws): void {
      if (typeof data !== 'string') {
        ws.send(createServerMessage('The data must be a string.'))
        return
      }

      let message: Message
      try {
        message = JSON.parse(data) as Message
      } catch {
        ws.send(createServerMessage('This is an invalid JSON.'))
        return
      }

      const { userName, comment } = message

      if (!userName || userName.trim() === '') {
        ws.send(createServerMessage('The userName is required.'))
        return
      }

      if (!comment) {
        const { raw } = ws

        if (raw && !wsClientUsernames.has(raw)) {
          wsClientUsernames.set(raw, userName)
          broadcastMessage(createServerMessage(`Hello, ${userName}!`))

          const joinMessage: SSEMessage = createSseMessage(`${userName} joined the chat.`)

          if (sseClients.size > 0) for (const send of sseClients) void send(joinMessage)
          else pendingSseMessages.push(joinMessage)
        } else ws.send(createServerMessage('The comment is required.'))

        return
      }

      if (comment.trim() === '') {
        ws.send(createServerMessage('The comment is required.'))
        return
      }

      broadcastMessage(JSON.stringify(message))

      for (const send of sseClients) void send(createSseMessage(`${userName} sent a message.`))

      messages.push(message)
      const pickedMessage: Message = messages[Math.floor(Math.random() * messages.length)]

      setTimeout(() => broadcastMessage(createServerMessage(pickedMessage.comment)), 1000)

      for (const send of sseClients) void send(createSseMessage(`Server sent a message.`))
    },
    onClose(_event, { raw }): void {
      if (raw) {
        const userName = wsClientUsernames.get(raw)

        wsClients.delete(raw)
        wsClientUsernames.delete(raw)

        if (userName) {
          broadcastMessage(createServerMessage(`See you later, ${userName}.`))

          for (const send of sseClients)
            void send(createSseMessage(`The ${userName}'s connection was closed.`))
        }
      }
    }
  }))
)

app.get('/sse', async c =>
  streamSSE(c, async stream => {
    const sender = (sseMessage: SSEMessage) => stream.writeSSE(sseMessage),
      abortSignal: AbortSignal | undefined = c.req.raw?.signal

    sseClients.add(sender)

    if (pendingSseMessages.length > 0) {
      for (const message of pendingSseMessages) sender(message)
      pendingSseMessages.length = 0
    }

    const checkConnection = setInterval(() => {
      void stream.writeSSE({ event: 'ping', data: 'ping' })
    }, 30_000)

    try {
      await new Promise<void>(resolve => {
        if (!abortSignal || abortSignal.aborted) return resolve()
        abortSignal.addEventListener?.('abort', () => resolve(), { once: true })
      })
    } finally {
      sseClients.delete(sender)
      clearInterval(checkConnection)
    }
  })
)

app.notFound(c => c.redirect(c.req.path.startsWith(`${CHAT_PAGE}/`) ? CHAT_PAGE : '/'))

export default { port: 5174, host: '0.0.0.0', fetch: app.fetch, websocket }
