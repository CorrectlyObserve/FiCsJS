import type { FiCsRouter } from 'ficsjs/router/server-only'
import { isAdmin } from '@/domain/role'
import type { User } from '@/domain/user'
import { adminOnly, requireUser } from '@/server/guards'

const middleware: FiCsRouter.Middleware = async ctx => {
  if (ctx.req.method === 'GET') return
  if (ctx.req.method === 'DELETE') return adminOnly(ctx)

  const { id, role }: User = await requireUser(ctx)
  if (!isAdmin(role) && String(id) !== ctx.dynamicParams.id) return ctx.deny()
}

export default middleware
