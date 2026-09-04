import type { User } from '@/domain/user'
import { rpcError } from '@/server/rpc'

let users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'member' },
  { id: 3, name: 'Carol', email: 'carol@example.com', role: 'member' }
]

export const getUsers = (): readonly User[] => users

export const findUser = (userId: number): User | undefined => users.find(({ id }) => id === userId)

export const nonExistentUserError = (userId: number) => {
  return rpcError({ code: 'NOT_FOUND', message: `The user with ID ${userId} does not exist.` })
}

export const addUser = (userData: Omit<User, 'id'>): User | null => {
  if (users.some(({ email }) => email === userData.email)) return null

  const user: User = { id: users.reduce((max, { id }) => Math.max(max, id), 0) + 1, ...userData }

  users = [...users, user]
  return user
}

export const removeUser = (userId: number): boolean => {
  const index: number = users.findIndex(({ id }) => id === userId)
  if (index === -1) return false

  users.splice(index, 1)
  return true
}
