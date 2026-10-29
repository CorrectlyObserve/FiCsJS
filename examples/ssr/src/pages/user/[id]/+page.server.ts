import type { FiCsRouter } from 'ficsjs/router/server-only'
import { isAdmin } from '@/domain/role'
import { toUserId, type User } from '@/domain/user'
import { NOT_FOUND_STATUS } from '@/domain/status'
import UserDetail from '@/pages/user/[id]/UserDetail'
import { requireUser } from '@/server/guards'
import { findUser } from '@/server/users'

export const meta = { title: 'User', description: 'View a single user.' }

export default async (ctx: FiCsRouter.MiddlewareCtx): Promise<string | FiCsRouter.Denial> => {
  const { role }: User = await requireUser(ctx)
  const id: number | null = toUserId(ctx.dynamicParams.id ?? ''),
    user: User | undefined = id === null ? undefined : findUser(id)

  if (!user) return ctx.deny({ code: NOT_FOUND_STATUS })

  return UserDetail.toString({ data: { user, isAdmin: isAdmin(role) } })
}
