export type Role = (typeof ROLES)[number]

export const isRole = (value: string): value is Role => ROLES.some(role => role === value)
export const ROLES = ['admin', 'member'] as const
