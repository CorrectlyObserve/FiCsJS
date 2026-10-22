import type { Message } from '@/pages/websocket-sse/Chat'

const messages: Message[] = []

export const getMessages = (): readonly Message[] => messages

export const addMessage = (message: Message): void => {
  messages.push(message)
}

export const pickMessage = (): Message | undefined =>
  messages[Math.floor(Math.random() * messages.length)]
