import type { User } from '@/types'

export const BASE_URL = 'https://jsonplaceholder.typicode.com/users' as const

export const fetchUsers = async ({ signal }: { signal: AbortSignal }): Promise<User[]> =>
  await fetch(BASE_URL, { signal }).then(res => res.json())

export const getExpectedUser = (users: readonly User[], userId: User['id']): User => {
  let targetUser: User | undefined,
    maxId = 0

  for (const user of users) {
    const { id } = user

    if (id === userId) targetUser = user
    if (id > maxId) maxId = id
  }

  if (!targetUser) throw new Error(`The user with ID ${userId} does not exist.`)
  return { ...targetUser, id: maxId + 1 }
}

export const USERS_KEY = ['users'] as const
