export interface Message { user: string; comment: string }

export type Method = 'PUT' | 'PATCH' | 'DELETE'

export interface Photo {
  id: string
  author: string
  isLoaded: boolean
}

export interface User {
  id: number
  name: string
  email: string
}