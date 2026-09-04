import type { User } from '@/domain/user'
import { requireUser } from '@/server/auth'
import Top from '@/pages/index/Top'

export const meta = {
  title: 'FiCsJS middleware example',
  description: 'Go to the user list or log out.'
}

export default async (ctx: { req: Request }): Promise<string> => {
  const { name, role }: User = await requireUser(ctx)
  return Top.toString({ data: { name, role } })
}
