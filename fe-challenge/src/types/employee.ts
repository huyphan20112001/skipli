import type { employeeSchema, setupAccountSchema } from '@src/schemas/employee'
import type z from 'zod'

export type Employee = {
  id: string
  name: string
  email: string
  department: string
  isActive: boolean
  createdAt: Date
  lastLogin?: Date
  createdBy: string
}

export type AddEmployeeFormData = z.infer<typeof employeeSchema>

export type SetupAccountFormData = z.infer<typeof setupAccountSchema>
