export type Direction = 'up' | 'down'

export interface Message {
  userName: string
  comment: string
}

export type Method = 'PUT' | 'PATCH' | 'DELETE'

export interface Photo {
  id: string
  author: string
  isLoaded: boolean
}

export interface SSEMessage {
  event: 'log'
  data: string
}

export interface User {
  id: number
  name: string
  email: string
}
