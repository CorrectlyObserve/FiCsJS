import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { serveStatic } from '@hono/node-server/serve-static'
import { createBunWebSocket } from 'hono/bun'
import type { ServerWebSocket } from 'bun'
import Link from './src/components/materials/Link'
import Users from './src/components/Users'
import ChatButton from './src/components/ChatButton'
import Photos from './src/components/Photos'
import Tab from './src/components/Tab'
import Router from './src/components/Router'
import { Message } from './src/types'
import { CHAT_PAGE, getTimestamp } from './src/utils'

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
        <script type="module" src="/dist/${path}.js"></script>
      </body>
    </html>
  `

const link = Link()
app.get('/', c =>
  c.html(
    template({
      title: 'FiCsJS with Hono',
      description: 'This is a simple example of FiCsJS with Hono in SSR.',
      content: `
        ${link.toString({ href: '/scroll', text: 'Go to the scroll page' })}
        ${Users.toString()}
        ${ChatButton.toString()}
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
        ${ChatButton.toString()}
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

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>()
const messages: Message[] = []
const sseClients = new Set<(sseMessage: { event: 'log'; data: string }) => Promise<void>>()

app.get(
  '/ws',
  upgradeWebSocket(() => ({
    onMessage({ data }, ws): void {
      if (typeof data !== 'string') throw new Error('The data is not a string...')

      const message: Message = JSON.parse(data)
      if (!message.userName) throw new Error('The userName is required in the message...')

      const { userName } = message

      if (message.comment) {
        ws.send(JSON.stringify(message))
        for (const send of sseClients)
          void send({ event: 'log', data: `${getTimestamp()}: ${userName} sent a message.` })

        messages.push(message)
        const pickedMessage: Message = messages[Math.floor(Math.random() * messages.length)]
        setTimeout(() => ws.send(JSON.stringify({ ...pickedMessage, userName: 'Server' })), 500)

        for (const send of sseClients)
          void send({ event: 'log', data: `${getTimestamp()}: Server sent a message.` })
        return
      }

      ws.send(JSON.stringify({ userName: 'Server', comment: `Hello, ${userName}!` }))
      for (const send of sseClients)
        void send({ event: 'log', data: `${getTimestamp()}: ${userName} joined the chat.` })
    },
    onClose: () => {
      for (const send of sseClients)
        void send({ event: 'log', data: `${getTimestamp()}: The connection was closed.` })
    }
  }))
)

app.get('/sse', async c =>
  streamSSE(c, async stream => {
    const sender = (sseMessage: { event: 'log'; data: string }) => stream.writeSSE(sseMessage),
      abortSignal: AbortSignal | undefined = c.req.raw?.signal

    sseClients.add(sender)

    try {
      await new Promise<void>(resolve => {
        if (!abortSignal || abortSignal.aborted) return resolve()
        abortSignal.addEventListener?.('abort', () => resolve(), { once: true })
      })
    } finally {
      sseClients.delete(sender)
    }
  })
)

app.notFound(c => c.redirect(c.req.path.startsWith(`${CHAT_PAGE}/`) ? CHAT_PAGE : '/'))

export default { port: 5174, fetch: app.fetch, websocket }
