import type { FiCsRouter } from 'ficsjs/router/server-only'
import { paths } from '@/domain/path'
import { signedIn } from '@/server/auth'

const middleware: FiCsRouter.Middleware = ctx =>
  new URL(ctx.req.url).pathname === paths.LOGIN ? undefined : signedIn(ctx)

export default middleware
