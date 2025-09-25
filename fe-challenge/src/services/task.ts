import { API_ENDPOINTS } from '@src/constants/api-endpoint'
import api from '@src/lib/api'
import type { APIResponseUnion, FilterResponse } from '@src/types/common'
import type { Task } from '@src/types/task'

export const getTaskList = async ({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number
  limit?: number
  search?: string
}) => {
  return api.get<
    APIResponseUnion<{
      tasks: Task[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
      }
      filters: FilterResponse
    }>
  >(API_ENDPOINTS.TASK_LIST, {
    params: {
      page,
      limit,
      search,
    },
  })
}

export const createTask = async (data: {
  title: string
  description: string
  assignedTo?: string
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
}) => {
  return api.post<APIResponseUnion<{ taskId: string; task: Task }>>(
    API_ENDPOINTS.CREATE_TASK,
    data,
  )
}

export const updateTask = async (data: {
  taskId: string
  title?: string
  description?: string
  assignedTo?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}) => {
  return api.put<APIResponseUnion<{ task: Task }>>(
    API_ENDPOINTS.UPDATE_TASK,
    data,
  )
}

export const deleteTask = async (taskId: string) => {
  return api.post<APIResponseUnion<{ message: string }>>(
    API_ENDPOINTS.DELETE_TASK,
    {
      taskId,
    },
  )
}

export const getEmployeeAssignedTasks = async () => {
  return api.get<
    APIResponseUnion<{
      tasks: Task[]
    }>
  >(API_ENDPOINTS.EMPLOYEE_ASSIGNED_TASKS)
}
