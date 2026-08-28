import type { Role } from '@/domain/role'

export interface User {
  id: number
  name: string
  email: string
  role: Role
}
