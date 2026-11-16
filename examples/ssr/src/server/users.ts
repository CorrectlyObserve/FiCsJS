import type { User } from '@/domain/user'
import { rpcError } from '@/server/rpc'

const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'member' },
  { id: 3, name: 'Carol', email: 'carol@example.com', role: 'member' }
]

export const getUsers = (): readonly User[] => users

export const findUser = (value: number | string): User | undefined =>
  users.find(({ id, email }) => (typeof value === 'number' ? id : email) === value)

export const nonExistentUserError = (userId: number) =>
  rpcError({ code: 'NOT_FOUND', message: `The user ${userId} does not exist.` })

export const emailTakenError = (email: string) =>
  rpcError({ code: 'CONFLICT', message: `The email ${email} is already taken.` })

export const addUser = (userData: Omit<User, 'id'>): User | null => {
  if (findUser(userData.email)) return null

  const user: User = { id: users.reduce((max, { id }) => Math.max(max, id), 0) + 1, ...userData }

  users.push(user)
  return user
}

export const updateUser = (userId: number, patch: Partial<Omit<User, 'id'>>): User | null => {
  const index: number = users.findIndex(({ id }) => id === userId)
  if (index === -1) return null

  const updated: User = { ...users[index], ...patch }
  users[index] = updated
  return updated
}

export const removeUser = (userId: number): boolean => {
  const index: number = users.findIndex(({ id }) => id === userId)
  if (index === -1) return false

  users.splice(index, 1)
  return true
}
