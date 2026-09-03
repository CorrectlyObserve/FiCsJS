import type { FiCsRouter } from 'ficsjs/router/server-only'
import { requireUser } from '@/server/auth'
import type { User } from '@/domain/user'

const middleware: FiCsRouter.Middleware = async ctx => {
  const account: User = await requireUser(ctx)
  if (account.role !== 'admin') return ctx.deny()
}

export default middleware
