import { createPageHandler, createRpcHandler, type FiCsRouter } from 'ficsjs/router/server-only'
import { pages, rpcRouter } from '@fics/routing/server'
import { SESSION_COOKIE } from './src/server/auth'
import { getUsers, type User } from './src/server/users'
import globalCss from './src/globalCss'

const PORT: number = 5175 as const
const MISSING_USER_ID = 0 as const

const page = createPageHandler(pages, {
  render: ({ meta, content, script }: FiCsRouter.Render): string => `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/global.css" />
      </head>
      <body>
        <header><h1>${meta.title ?? ''}</h1></header>
        <main>${content}</main>
        <script type="module" src="${script}"></script>
      </body>
    </html>
  `,
  meta: { robots: 'noindex' }
})
const rpc = createRpcHandler(rpcRouter, { maxBodyBytes: 1024 })

const redirect = (location: string, cookie?: string): Response =>
  new Response(null, {
    status: 302,
    headers: { location, ...(cookie ? { 'set-cookie': cookie } : {}) }
  })

const sessionCookie = (userId?: number): string => {
  const value: string = userId === undefined ? '' : encodeURIComponent(userId)
  const base = `${SESSION_COOKIE}=${value}; HttpOnly; Path=/; SameSite=Lax` as const

  return userId === undefined ? `${base}; Max-Age=0` : base
}

const sessionRoutes = new Map<string, (req: Request) => Response | Promise<Response>>([
  [
    '/login',
    async (req: Request): Promise<Response> => {
      const form: FormData = await req.formData().catch(() => new FormData())
      const role: string = String(form.get('role') ?? '')
      let account: User | undefined

      if (role === 'admin' || role === 'member')
        account = getUsers().find(user => user.role === role)

      return account ? redirect('/', sessionCookie(account.id)) : redirect('/login')
    }
  ],
  ['/logout', (): Response => redirect('/login', sessionCookie())],
  ['/break-session', (): Response => redirect('/', sessionCookie(MISSING_USER_ID))]
])

Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const { pathname }: URL = new URL(req.url)

    if (pathname === '/global.css')
      return new Response(globalCss, { headers: { 'content-type': 'text/css; charset=utf-8' } })

    if (pathname.startsWith('/dist/')) {
      const file = Bun.file(`.${pathname}`)
      return (await file.exists()) ? new Response(file) : new Response(null, { status: 404 })
    }

    if (req.method === 'POST') {
      const sessionRoute: ((req: Request) => Response | Promise<Response>) | undefined =
        sessionRoutes.get(pathname)

      if (sessionRoute) return sessionRoute(req)
    }

    if (pathname.startsWith(rpcRouter.basePath)) return rpc(req)

    return page(req)
  }
})

console.log(`middleware example → http://localhost:${PORT}`)
