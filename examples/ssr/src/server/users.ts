import type { User } from '@/domain/user'

export const getUsers = (): readonly User[] => users

export const findUser = (userId: number): User | undefined => users.find(({ id }) => id === userId)


export const addUser = (userData: Omit<User, 'id'>): User | null => {
  if (users.some(({ email }) => email === userData.email)) return null

  const user: User = { id: users.reduce((max, { id }) => Math.max(max, id), 0) + 1, ...userData }

  users = [...users, user]
  return user
}

export const updateUser = (userId: number, patch: Partial<Omit<User, 'id'>>): User | null => {
  const current: User | undefined = findUser(userId)
  if (!current) return null

  const updated: User = { ...current, ...patch }

  users = users.map(user => (user.id === userId ? updated : user))
  return updated
}

export const removeUser = (userId: number): boolean => {
  const index: number = users.findIndex(({ id }) => id === userId)
  if (index === -1) return false

  users.splice(index, 1)
  return true
}
