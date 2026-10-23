import { normalizeEmail } from '@/domain/email'
import type { Role } from '@/domain/role'

export interface User {
  id: number
  name: string
  email: string
  role: Role
}

export const validateName = (value: string): string | null =>
  value.trim() === '' ? 'Enter a name.' : null

export const validateEmail = (value: string): string | null => {
  if (value.trim() === '') return 'Enter an email.'
  if (normalizeEmail(value) === null) return 'Enter a complete email, like sample@example.com.'

  return null
}
