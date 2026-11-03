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
    message(ws: ServerWebSocket<SocketData>, data: string | Buffer): void {
      if (typeof data !== 'string') {
        ws.send(createServerMessage('The data must be a string.'))
        return
      }

      const message: Partial<Message> | undefined = parseMessage(data)

      if (!message) {
        ws.send(createServerMessage('This is an invalid message.'))
        return
      }

      const { userName, comment }: Partial<Message> = message

      if (!userName || userName.trim() === '') {
        ws.send(createServerMessage('The userName is required.'))
        return
      }

      if (!comment) {
        if (ws.data.userName === '') {
          ws.data.userName = userName
          ws.send(createServerMessage(`Hello, ${userName}!`))
        } else ws.send(createServerMessage('The comment is required.'))

        return
      }

      if (comment.trim() === '') {
        ws.send(createServerMessage('The comment is required.'))
        return
      }

      broadcastMessage({ userName, comment })
      broadcastSseMessage(`${userName} sent a message.`)

      addMessage({ userName, comment })
      const picked: Message | undefined = pickMessage()

      setTimeout(() => {
        if (picked) broadcastMessage(picked.comment)
        broadcastSseMessage('The server sent a message.')
      }, 1000)
    },
    close(ws: ServerWebSocket<SocketData>): void {
      wsClients.delete(ws)

      const { userName }: SocketData = ws.data
      if (userName === '') return

      broadcastMessage(`See you later, ${userName}.`)
      broadcastSseMessage(`The ${userName}'s connection was closed.`)
    }
  }
})

console.log(`ssr example \u2192 http://localhost:${PORT}`)
