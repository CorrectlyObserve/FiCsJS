import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { createBunWebSocket, serveStatic } from 'hono/bun'
import type { ServerWebSocket } from 'bun'
import Link from './src/components/Link'
import Users from './src/pages/_components/Users'
import ChatButton from './src/components/ChatButton'
import Photos from './src/pages/scroll/_components/Photos'
import Tab from './src/pages/websocket-sse/_components/Tab'
import Router from './src/pages/websocket-sse/_components/Router'
import { SSEMessage, Message } from './src/types'
import { API_PATHS, CHAT_PAGE, getTimestamp } from './src/utils'

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
        <header class="flex justify-center flex-row py-2">
          <h1 class="text-xl text-center font-semibold">${title}</h1>
        </header>
        <main class="pb-8">${content}</main>
        <footer class="text-sm text-white text-center pb-4"><p>&copy; 2025 Masami Ogasawara</p></footer>
        <script type="module" src="/dist/${path.replace(/^\/+/, '')}.js"></script>
      </body>
    </html>
  `,
  link = Link(),
  chatButton = ChatButton()

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
  messages: Message[] = [],
  wsClients = new Set<ServerWebSocket>(),
  wsClientUsernames = new Map<ServerWebSocket, string>(),
  broadcastMessage = (message: string | Message): void => {
    for (const client of wsClients)
      try {
        client.send(
          typeof message === 'string' ? createServerMessage(message) : JSON.stringify(message)
        )
      } catch {
        wsClients.delete(client)
      }
  },
  sseClients = new Set<(sseMessage: SSEMessage) => Promise<void>>(),
  broadcastSseMessage = (message: string): void => {
    for (const sender of sseClients)
      try {
        void sender({ event: 'log', data: `${getTimestamp()}: ${message}` })
      } catch {
        sseClients.delete(sender)
      }
  }

app.get(
  API_PATHS.ws,
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
          ws.send(createServerMessage(`Hello, ${userName}!`))
        } else ws.send(createServerMessage('The comment is required.'))

        return
      }

      if (comment.trim() === '') {
        ws.send(createServerMessage('The comment is required.'))
        return
      }

      broadcastMessage(message)
      broadcastSseMessage(`${userName} sent a message.`)

      messages.push(message)
      const pickedMessage: Message = messages[Math.floor(Math.random() * messages.length)]

      setTimeout(() => {
        broadcastMessage(pickedMessage.comment)
        broadcastSseMessage(`The server sent a message.`)
      }, 1000)
    },
    onClose(_event, { raw }): void {
      if (raw) {
        const userName = wsClientUsernames.get(raw)

        wsClients.delete(raw)
        wsClientUsernames.delete(raw)

        if (userName) {
          broadcastMessage(`See you later, ${userName}.`)
          broadcastSseMessage(`The ${userName}'s connection was closed.`)
        }
      }
    }
  }))
)

app.get(API_PATHS.log, c =>
  streamSSE(c, async stream => {
    const sender = (sseMessage: SSEMessage) => stream.writeSSE(sseMessage),
      abortSignal: AbortSignal | undefined = c.req.raw?.signal

    sseClients.add(sender)
    void stream.writeSSE({ event: 'ping', data: 'ping' })

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

app.get(API_PATHS.stream, c => {
  const RANDOM_LENGTH = 1000,
    CHUNK_SIZE = 10,
    signal: AbortSignal | undefined = c.req.raw?.signal,
    encoder = new TextEncoder(),
    stream = new ReadableStream({
      async start(controller) {
        const chars = [...Array(36)].map((_, i) => i.toString(36)).join(''),
          random: string[] = []

        for (let i = 0; i < RANDOM_LENGTH; i++) {
          const char = chars.charAt(Math.floor(Math.random() * chars.length))
          random.push(Math.random() < 0.5 ? char.toUpperCase() : char)
        }

        const fullText = random.join('')

        for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
          if (signal?.aborted) {
            controller.close()
            return
          }
          const index = Math.floor(i / CHUNK_SIZE),
            chunk = fullText.slice(i, i + CHUNK_SIZE),
            eventData = `data: ${JSON.stringify({ chunk, index })}\n\n`

          controller.enqueue(encoder.encode(eventData))
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        controller.enqueue(encoder.encode(`event: complete\ndata: \n\n`))
        controller.close()
      }
    })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
})

app.notFound(c => c.redirect(c.req.path.startsWith(`${CHAT_PAGE}/`) ? CHAT_PAGE : '/'))

export default { port: 5174, host: '0.0.0.0', fetch: app.fetch, websocket }
