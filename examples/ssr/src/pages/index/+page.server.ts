import type { User } from '@/domain/user'
import { requireUser } from '@/server/auth'
import Top from '@/pages/index/Top'

export const meta = {
  title: 'FiCsJS on Bun',
  description: 'This is an example of FiCsJS for SSR / SSG.'
}

export default async (ctx: { req: Request }): Promise<string> => {
  const { name, role }: User = await requireUser(ctx)
  return Top.toString({ data: { name, role } })
}
