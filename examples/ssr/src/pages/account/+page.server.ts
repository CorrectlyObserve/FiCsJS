import type { User } from '@/domain/user'
import Account from '@/pages/account/Account'
import { requireUser } from '@/server/guards'

export const meta = { title: 'Account', description: 'Update your display name.' }

export default async (ctx: { req: Request }): Promise<string> => {
  const { name, email, role }: User = await requireUser(ctx)

  return Account.toString({ data: { name, email, role } })
}
