export interface User {
  id: number
  name: string
  email: string
}

const defaultUsers: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Carol', email: 'carol@example.com' }
]

let users: User[] = defaultUsers

export const getUsers = (): readonly User[] => users

export const findUser = (id: number): User | undefined => users.find(user => user.id === id)

export const addUser = (userData: Omit<User, 'id'>): User | null => {
  if (users.some(({ email }) => email === userData.email)) return null

  const user: User = { id: users.reduce((max, { id }) => Math.max(max, id), 0) + 1, ...userData }

  users = [...users, user]
  return user
}

export const updateUser = (id: number, patch: Partial<Omit<User, 'id'>>): User | undefined => {
  const current: User | undefined = findUser(id)
  if (!current) return undefined

  const updated: User = { ...current, ...patch }
  users = users.map(user => (user.id === id ? updated : user))
  return updated
}

export const removeUser = (userId: number): boolean => {
  const index: number = users.findIndex(({ id }) => id === userId)
  if (index === -1) return false

  users.splice(index, 1)
  return true
}
