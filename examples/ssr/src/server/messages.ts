import type { ServerWebSocket } from 'bun'
import type { Message } from '@/domain/message'

export type SocketData = { userName: Message['userName'] }
export type SseSender = (event: string, data: string) => void

const messages: Message[] = []

export const getMessages = (): readonly Message[] => messages

export const addMessage = (message: Message): void => {
  messages.push(message)
}

export const pickMessage = (): Message | undefined =>
  messages[Math.floor(Math.random() * messages.length)]

export const wsClients: Set<ServerWebSocket<SocketData>> = new Set()

export const createServerMessage = (comment: string): string =>
  JSON.stringify({ userName: 'Server', comment })

export const broadcastMessage = (message: string | Message): void => {
  for (const client of wsClients)
    try {
      client.send(
        typeof message === 'string' ? createServerMessage(message) : JSON.stringify(message)
      )
    } catch {
      wsClients.delete(client)
    }
}
