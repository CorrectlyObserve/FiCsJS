import type { Message } from '@/domain/message'

const messages: Message[] = []

export const getMessages = (): readonly Message[] => messages

export const addMessage = (message: Message): void => {
  messages.push(message)
}

export const pickMessage = (): Message | undefined =>
  messages[Math.floor(Math.random() * messages.length)]
