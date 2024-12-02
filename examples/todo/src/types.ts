export interface Task {
  id: number
  title: string
  description: string
  created_at: number
  updated_at: number
  completed_at?: number
}
