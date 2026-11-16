import type { FiCsRouter } from 'ficsjs/router/server-only'
import { paths } from '@/domain/path'
import { signedIn } from '@/server/guards'

const middleware: FiCsRouter.Middleware = ctx =>
  ctx.route === paths.LOGIN ? undefined : signedIn(ctx)

export default middleware
