import type { FiCsRouter } from 'ficsjs/router/server-only'
import { LOGIN_PATH } from '@/domain/path'
import { signedIn } from '@/server/auth'

const middleware: FiCsRouter.Middleware = ctx =>
  new URL(ctx.req.url).pathname === LOGIN_PATH ? undefined : signedIn(ctx)

export default middleware
