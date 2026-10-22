import { requireUser } from '@/server/auth'
import { isAdmin } from '@/domain/role'
import type { User } from '@/domain/user'
import { defineProcedure, parseId } from '@/server/rpc'
import { findUser, getUsers, nonExistentUserError } from '@/server/users'

export const list = defineProcedure({
  handler: async (_input, ctx): Promise<{ users: User[]; isAdmin: boolean }> => {
    const { role }: User = await requireUser(ctx)
    return { users: [...getUsers()], isAdmin: isAdmin(role) }
  }
})

export const get = defineProcedure({
  input: parseId,
  handler: async ({ id }, ctx): Promise<{ user: User; isAdmin: boolean }> => {
    const { role }: User = await requireUser(ctx)
    const user: User | undefined = findUser(id)

    if (!user) throw nonExistentUserError(id)

    return { user, isAdmin: isAdmin(role) }
  }
})
