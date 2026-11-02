export interface Message {
  userName: string
  comment: string
}

export const parseMessage = (data: string): Partial<Message> | undefined => {
  let value: unknown
  try {
    value = JSON.parse(data)
  } catch {
    return
  }

  if (typeof value !== 'object' || value === null) return

  const { userName, comment } = value as Record<string, unknown>

  if (
    typeof userName === 'string' &&
    (typeof comment === 'string' || typeof comment === 'undefined')
  )
    return { userName, comment }

  return
}
