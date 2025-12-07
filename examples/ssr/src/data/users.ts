import type { User } from '@/types'

export const API_PATH = 'https://jsonplaceholder.typicode.com/users' as const

const fetchUsers = async (): Promise<User[]> => {
  const res = await fetch(API_PATH),
    json: User[] = await res.json()

  return json
}

export const users: User[] = await fetchUsers()
