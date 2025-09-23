import { API_ENDPOINTS } from '@src/constants/api-endpoint'
import api from '@src/lib/api'
import type { APIResponseUnion, FilterResponse } from '@src/types/common'
import type { Employee } from '@src/types/employee'

export const getEmployeeList = async ({
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
      employees: Employee[]
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
      filters: FilterResponse
    }>
  >(API_ENDPOINTS.EMPLOYEE_LIST, {
    params: {
      page,
      limit,
      search,
    },
  })
}

export const createEmployee = async (data: {
  name: string
  email: string
  department: string
}) => {
  return api.post<APIResponseUnion<{ employeeId: string; employee: Employee }>>(
    API_ENDPOINTS.CREATE_EMPLOYEE,
    data,
  )
}

export const updateEmployee = async (data: {
  employeeId: string
  name?: string
  email?: string
  department?: string
  isActive?: boolean
}) => {
  return api.put<APIResponseUnion<{ employee: Employee }>>(
    API_ENDPOINTS.UPDATE_EMPLOYEE,
    data,
  )
}

export const deleteEmployee = async (employeeId: string) => {
  return api.post<APIResponseUnion<{ message: string }>>(
    API_ENDPOINTS.DELETE_EMPLOYEE,
    {
      employeeId,
    },
  )
}

export const validateSetupToken = async (token: string) => {
  return api.get<APIResponseUnion<{ valid: boolean; message?: string }>>(
    API_ENDPOINTS.VALIDATE_SETUP_TOKEN.replace(':token', token),
  )
}

export const setupEmployeeAccount = async (data: {
  token: string
  username: string
  password: string
}) => {
  return api.post<
    APIResponseUnion<{
      message: string
      employeeId: string
      username: string
      setupComplete: boolean
      token: string
    }>
  >(API_ENDPOINTS.SETUP_EMPLOYEE_ACCOUNT, data)
}

export const getChatParticipants = async () => {
  return api.get<
    APIResponseUnion<{
      participants: Employee[]
    }>
  >(API_ENDPOINTS.GET_CHAT_PARTICIPANTS, {
    params: {
      page: 1,
      limit: 100,
    },
  })
}

export const employeeLogin = async (email: string) => {
  return api.post<APIResponseUnion<{ message: string }>>(
    API_ENDPOINTS.EMPLOYEE_LOGIN,
    { email },
  )
}

export const employeeVerify = async (data: {
  email: string | number
  accessCode: string | number
}) => {
  return api.post<
    APIResponseUnion<{
      message: string
      employeeId: string
      username: string
      token: string
    }>
  >(API_ENDPOINTS.EMPLOYEE_VERIFY, data)
}
