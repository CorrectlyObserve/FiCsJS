const RFC5321_MAILBOX_LIMIT = 254 as const,
  EMAIL_REGEX = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

export const isValidEmail = (email: string): boolean =>
  email.length <= RFC5321_MAILBOX_LIMIT && EMAIL_REGEX.test(email)

export const normalizeEmail = (email: unknown): string | null => {
  if (typeof email !== 'string') return null

  const normalized: string = email.trim().toLowerCase()
  return isValidEmail(normalized) ? normalized : null
}
