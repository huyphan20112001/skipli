import type { loginSchema, phoneVerificationSchema } from '@src/schemas/login'
import type z from 'zod'

export type LoginFormData = z.infer<typeof loginSchema>

export type PhoneVerificationFormData = z.infer<typeof phoneVerificationSchema>
