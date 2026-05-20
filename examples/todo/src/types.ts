export interface Task {
  id: number
  title: string
  description: string
  createdAt: number
  updatedAt: number
  completedAt?: number
}
