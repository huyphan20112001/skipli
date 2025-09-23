import z from 'zod'

export const employeeSchema = z.object({
  name: z.string(),
  email: z.email(),
  department: z.string(),
})

export const setupAccountSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
