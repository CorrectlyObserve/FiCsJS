import { createQueryCache } from 'ficsjs'
import { pages, rpcRouter } from '@fics/routing/server'
import { createPageHandler, createRpcHandler } from 'ficsjs/router/server-only'
import { type Message, parseMessage } from '@/domain/message'
import { getUserPath, paths } from '@/domain/path'
import { viaLogin } from '@/domain/redirect'
import type { User } from '@/domain/user'
import { authRoutes, redirect } from '@/server/auth'
import {
  type SocketData,
  addMessage,
  broadcastMessage,
  createServerMessage,
  pickMessage,
  wsClients
} from '@/server/messages'
import { render } from '@/server/render'
import { getSessionUser } from '@/server/session'
import { broadcastSseMessage, openLogStream, openTextStream } from '@/server/stream'
import type { ServerWebSocket } from 'bun'

const PORT: number = Number(Bun.env.PORT) || 5174

const page: (req: Request) => Promise<Response> = createPageHandler(pages, {
  render,
  createContext: () => ({ queryCache: createQueryCache() }),
  viewTransition: true
})
const rpc: (req: Request) => Promise<Response> = createRpcHandler(rpcRouter, { maxBodyBytes: 1024 })

Bun.serve<SocketData>({
  port: PORT,
  async fetch(req: Request, server): Promise<Response | undefined> {
    const { pathname }: URL = new URL(req.url)

    if (pathname === paths.api.WS)
      return server.upgrade(req, { data: { userName: '' } })
        ? undefined
        : new Response('This endpoint expects a WebSocket upgrade.', { status: 426 })

    if (pathname.startsWith('/assets/')) {
      const file = Bun.file(`./dist${pathname}`)
      return (await file.exists()) ? new Response(file) : new Response(null, { status: 404 })
    }

    if (req.method === 'POST') {
      const authRoute = authRoutes.get(pathname)
      if (authRoute) return authRoute(req)
    }

    if (pathname === paths.api.LOG) return openLogStream(req)
    if (pathname === paths.api.STREAM) return openTextStream(req)
    if (pathname.startsWith(rpcRouter.basePath)) return rpc(req)

    if (pathname === paths.ACCOUNT) {
      const user: User | null = getSessionUser(req)
      return redirect(user ? getUserPath(user.id) : viaLogin(paths.ACCOUNT))
    }

    const res: Response = await page(req)
    res.headers.set('cache-control', 'no-store')
    return res
  },
  websocket: {
    open(ws: ServerWebSocket<SocketData>): void {
      wsClients.add(ws)
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

// ── FiCsJS: SSR pages + RPC ──
const pageHandler = createPageHandler(pages, {
  render: ({ meta, content, script }: FiCsRouter.Render): string => `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" type="text/css" href="/dist/global.css" />
      </head>
      <body class="bg-dark px-4">
        <header class="flex justify-center flex-row py-2">
          <h1 class="text-xl text-center font-semibold">${meta.title ?? ''}</h1>
        </header>
        <main class="pb-8">${content}</main>
        <footer class="text-sm text-white text-center pb-4"><p>&copy; 2025 Masami Ogasawara</p></footer>
        <script type="module" src="${script}"></script>
      </body>
    </html>
  `,
  createContext: () => ({ queryCache: createQueryCache() })
})

// SSR catch-all: registered last so the specific routes above (WS/SSE/stream, RPC) match first.
app.get('*', ({ req: { raw } }) => pageHandler(raw))

const rpcHandler = createRpcHandler(rpcRouter, { maxBodyBytes: 1024 })
app.all(`${rpcRouter.basePath}/*`, ({ req: { raw } }) => rpcHandler(raw))

export default { port: 5174, host: '0.0.0.0', fetch: app.fetch, websocket }
