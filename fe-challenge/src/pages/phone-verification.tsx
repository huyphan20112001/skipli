import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@src/components/ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@src/components/ui/input-otp'
import { phoneVerificationSchema } from '@src/schemas/login'
import type { PhoneVerificationFormData } from '@src/types/login'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '../components/ui/form'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { handleError } from '@src/utils/error'
import { ownerVerifyCode } from '@src/services/auth'
import { Loader2 } from 'lucide-react'
import { PATHNAME } from '@src/constants/pathname'

export function PhoneVerification() {
  const loginForm = useForm<PhoneVerificationFormData>({
    resolver: zodResolver(phoneVerificationSchema),
    defaultValues: { code: '' },
  })

  const code = loginForm.watch('code')

  const { state } = useLocation()
  const { mutateAsync: verify, isPending } = useMutation({
    mutationKey: ['owner-verify'],
    mutationFn: () => ownerVerifyCode(state.phoneNumber, code),
    onError: (error) => {
      handleError(error)
    },
    onSuccess: ({ data }) => {
      toast.success(data.message)
      localStorage.setItem('token', data.data?.token || '')
      window.location.href = PATHNAME.DASHBOARD
    },
  })

  const onSubmit = async () => {
    await verify()
  }

  return (
    <div className="flex flex-col gap-6 max-w-96 mx-auto h-dvh items-center justify-center">
      <Form {...loginForm}>
        <form onSubmit={loginForm.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold">Phone Verification</h1>
              <div className="text-center text-sm">
                Please enter the verification code sent to your phone
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <FormField
                control={loginForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormControl>
                      <InputOTP
                        maxLength={6}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        autoFocus
                        containerClassName="justify-center"
                        className="w-12 text-center"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <Button type="submit" variant="default" className="w-full">
                {isPending ? <Loader2 className="animate-spin" /> : 'Verify'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
      <div>
        <p className="text-center text-sm text-muted-foreground">
          Didn't receive the code? <Link to="#">Resend</Link>
        </p>
      </div>
    </div>
  )
}
