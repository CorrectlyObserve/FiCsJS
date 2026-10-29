import type { FiCsRouter } from 'ficsjs/router/server-only'
import { adminOnly } from '@/server/guards'

const middleware: FiCsRouter.Middleware = ctx =>
  ctx.req.method === 'GET' ? undefined : adminOnly(ctx)

export default middleware
