import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@src/components/ui/button'
import { Input } from '@src/components/ui/input'
import { PATHNAME } from '@src/constants/pathname'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { handleError } from '@src/utils/error'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@src/components/ui/form'
import { Loader2 } from 'lucide-react'
import { employeeLogin } from '@src/services/employee'

const emailLoginSchema = z.object({
  email: z.string().email(),
})
type EmailLoginForm = z.infer<typeof emailLoginSchema>

export default function EmailLogin() {
  const loginForm = useForm<EmailLoginForm>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: '' },
  })
  const navigate = useNavigate()
  const email = loginForm.watch('email')

  const { mutateAsync: sendEmail, isPending } = useMutation({
    mutationKey: ['owner-login-email', email],
    mutationFn: employeeLogin,
    onError: (error) => {
      handleError(error)
    },
    onSuccess: ({ data }) => {
      toast.success(data?.data?.message ?? 'Check your email for the code.')
      navigate(PATHNAME.EMAIL_VERIFICATION, { state: { email } })
    },
  })

  const onSubmit = async () => {
    await sendEmail(email)
  }

  return (
    <div className="flex flex-col gap-6 max-w-96 mx-auto h-dvh items-center justify-center">
      <Form {...loginForm}>
        <form onSubmit={loginForm.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold">Email Login</h1>
              <div className="text-center text-sm">
                Please enter your email to receive a verification code
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel htmlFor="email">Email</FormLabel>
                    <FormControl>
                      <Input
                        id="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                variant="default"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? <Loader2 className="animate-spin" /> : 'Send code'}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <div>
        <p className="text-center text-sm text-muted-foreground">
          Passwordless authentication methods.
        </p>
      </div>
    </div>
  )
}
