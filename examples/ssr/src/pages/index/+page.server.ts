import { isAdmin } from '@/domain/role'
import type { User } from '@/domain/user'
import UserList from '@/pages/index/UserList'
import { requireUser } from '@/server/guards'
import { getUsers } from '@/server/users'

export const meta = { title: 'Users', description: 'Browse the user list.' }

export default async (ctx: { req: Request }): Promise<string> => {
  const { role }: User = await requireUser(ctx)

  return UserList.toString({ data: { users: [...getUsers()], isAdmin: isAdmin(role) } })
}
