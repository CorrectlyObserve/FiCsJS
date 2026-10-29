import { normalizeEmail } from '@/domain/email'
import type { Role } from '@/domain/role'

export interface User {
  id: number
  name: string
  email: string
  role: Role
}

export const FAIL_USER = 'failUser' as const

export const toUserId = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isInteger(value) && value > 0 ? value : null
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : null
}

export const validateName = (value: string): string | null =>
  value.trim() === '' ? 'Enter a name.' : null

export const validateEmail = (value: string): string | null => {
  if (value.trim() === '') return 'Enter an email.'
  if (normalizeEmail(value) === null) return 'Enter a complete email, like sample@example.com.'

  return null
}
