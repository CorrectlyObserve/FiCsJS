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

export const getUsers = (): User[] => users

export const findUser = (id: number): User | undefined => users.find(user => user.id === id)

export const addUser = (input: Omit<User, 'id'>): User => {
  const user: User = { id: users.reduce((max, { id }) => Math.max(max, id), 0) + 1, ...input }

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

export const removeUser = (id: number): boolean => {
  const exists: boolean = users.some(user => user.id === id)
  if (exists) users = users.filter(user => user.id !== id)

  return exists
}
