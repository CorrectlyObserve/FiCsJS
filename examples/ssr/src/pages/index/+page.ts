import { createQueryCache } from 'ficsjs'
import ChatButton from '@/components/ChatButton'
import Link from '@/components/Link'
import { fetchUsers, USERS_KEY } from '@/data/users'
import Users from '@/pages/Users'
import type { User } from '@/types'

type QueryCache = ReturnType<typeof createQueryCache>

export const meta = {
  title: 'FiCsJS with Hono',
  description: 'This is a simple example of FiCsJS with Hono in SSR.'
}

export default async ({ queryCache }: { queryCache: QueryCache }): Promise<string> => {
  await queryCache.prefetch(USERS_KEY, fetchUsers)
  const users: User[] = queryCache.get<User[]>(USERS_KEY) ?? []

  return `
    ${Link.toString({ data: { href: '/scroll', text: 'Go to the scroll page' } })}
    ${Users.toString({ data: { users } })}
    ${ChatButton.toString()}
  `
}
