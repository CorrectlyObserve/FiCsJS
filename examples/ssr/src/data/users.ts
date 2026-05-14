import type { User } from '@/types'

export const BASE_URL = 'https://jsonplaceholder.typicode.com/users' as const

export const fetchUsers = async ({ signal }: { signal: AbortSignal }): Promise<User[]> =>
  await fetch(BASE_URL, { signal }).then(res => res.json())

export const USERS_KEY = ['users'] as const
