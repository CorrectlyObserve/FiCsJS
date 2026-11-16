import UserList from '@/pages/index/UserList'
import { getUsers } from '@/server/users'

export const meta = { title: 'Users', description: 'Browse the user list.' }

export default async (): Promise<string> => UserList.toString({ data: { users: [...getUsers()] } })
