import type { FiCsRouter } from 'ficsjs/router/server-only'
import { NEW_USER_PATH } from '@/domain/path'
import { adminOnly, signedIn } from '@/server/auth'

// For RPC
const middleware: FiCsRouter.Middleware = async ctx => {
  const denial: Awaited<ReturnType<typeof signedIn>> = await signedIn(ctx)
  if (denial) return denial

  if (new URL(ctx.req.url).pathname === NEW_USER_PATH) return adminOnly(ctx)
}

export default middleware
