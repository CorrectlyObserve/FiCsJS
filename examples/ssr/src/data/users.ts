import type { User } from '@/types'

export const api = 'https://jsonplaceholder.typicode.com/users'
export const users: User[] = await fetch(api).then(res => res.json())
