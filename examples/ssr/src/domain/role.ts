export type Role = (typeof ROLES)[number]

export const ROLES = ['admin', 'member'] as const

export const isAdmin = (role: Role): role is 'admin' => role === 'admin'
export const isRole = (value: string): value is Role => ROLES.some(role => role === value)
