export interface Task {
  id: number
  title: string
  description: string
  created_at: number
  completed_at?: number
  deleted_at?: number
}
