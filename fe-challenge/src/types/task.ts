import type { taskSchema } from '@src/schemas/task'
import type z from 'zod'

export interface Task {
  id: string
  title: string
  description: string
  assignedTo?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  createdAt: Date
  updatedAt?: Date
  createdBy: string
  completedAt?: Date
}

export type AddTaskFormData = z.infer<typeof taskSchema>