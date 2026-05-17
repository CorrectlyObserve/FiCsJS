import type { User } from '@/types'

export const BASE_URL = 'https://jsonplaceholder.typicode.com/users' as const

export const fetchUsers = async ({ signal }: { signal: AbortSignal }): Promise<User[]> =>
  await fetch(BASE_URL, { signal }).then(res => res.json())

export const getExpectedUser = (users: User[], userId: User['id']): User => {
  let targetUser: User | undefined
  let maxId = 0

  for (const user of users) {
    if (user.id === userId) targetUser = user
    if (user.id > maxId) maxId = user.id
  }

  if (!targetUser) throw new Error(`The user with ID ${userId} does not exist.`)

  return { ...targetUser, id: maxId + 1 }
}

export const USERS_KEY = ['users'] as const
