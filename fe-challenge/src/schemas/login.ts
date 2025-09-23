import { z } from 'zod'

export const loginSchema = z.object({
  phone: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 characters long' })
    .max(15, { message: 'Phone number must be at most 15 characters long' })
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' }),
})

export const phoneVerificationSchema = z.object({
  code: z
    .string()
    .length(6, { message: 'Verification code must be 6 characters long' })
    .regex(/^\d{6}$/, { message: 'Verification code must be numeric' }),
})
