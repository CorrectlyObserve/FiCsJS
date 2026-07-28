import { type QueryCache } from 'ficsjs'
import ChatButton from '@/components/ChatButton'
import Link from '@/components/Link'
import Users, { USERS_KEY } from '@/pages/index/Users'
import { getUsers } from '@/server/users'
import type { User } from '@/types'

export const meta = {
  title: 'FiCsJS with Hono',
  description: 'This is a simple example of FiCsJS with Hono in SSR.'
}

export default async ({ queryCache }: { queryCache: QueryCache }): Promise<string> => {
  await queryCache.prefetch(USERS_KEY, async () => getUsers())
  const users: User[] = queryCache.get<User[]>(USERS_KEY) ?? []

  return `
    ${Link.toString({ data: { href: '/scroll', text: 'Go to the scroll page' } })}
    ${Users.toString({ data: { users } })}
    ${ChatButton.toString()}
  `
}
