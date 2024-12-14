export interface Task {
  id: number
  title: string
  description: string
  created_at: number
  updated_at: number
  completed_at?: number
}

export interface TaskQueue {
  task: Task
  status: 'add' | 'update' | 'complete' | 'delete'
}
