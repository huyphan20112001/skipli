import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@src/components/ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@src/components/ui/input-otp'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@src/components/ui/form'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { handleError } from '@src/utils/error'
import { Loader2 } from 'lucide-react'
import { PATHNAME } from '@src/constants/pathname'
import { employeeVerify } from '@src/services/employee'

const emailVerificationSchema = z.object({
  accessCode: z.string().min(1),
})
type EmailVerificationForm = z.infer<typeof emailVerificationSchema>

export default function EmailVerification() {
  const loginForm = useForm<EmailVerificationForm>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { accessCode: '' },
  })

  const code = loginForm.watch('accessCode')
  const { state } = useLocation()

  const { mutateAsync: verify, isPending } = useMutation({
    mutationKey: ['owner-verify-email', code],
    mutationFn: employeeVerify,
    onError: (error) => {
      handleError(error)
    },
    onSuccess: ({ data }) => {
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token)
        window.location.href = PATHNAME.MESSAGES
      }
    },
  })

  const onSubmit = async (data: EmailVerificationForm) => {
    await verify({
      email: state?.email,
      accessCode: data.accessCode,
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-96 mx-auto h-dvh items-center justify-center">
      <Form {...loginForm}>
        <form onSubmit={loginForm.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold">Email Verification</h1>
              <div className="text-center text-sm">
                Please enter the verification code sent to your email
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <FormField
                control={loginForm.control}
                name="accessCode"
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
              />
              <Button type="submit" variant="default" className="w-full">
                {isPending ? <Loader2 className="animate-spin" /> : 'Verify'}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <div>
        <p className="text-center text-sm text-muted-foreground">
          Didn't receive the code? <Link to={PATHNAME.EMAIL_LOGIN}>Resend</Link>
        </p>
      </div>
    </div>
  )
}
