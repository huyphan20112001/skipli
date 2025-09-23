import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@src/components/ui/button'
import { Input } from '@src/components/ui/input'
import { PATHNAME } from '@src/constants/pathname'
import { loginSchema } from '@src/schemas/login'
import { loginOwnerWithPhone } from '@src/services/auth'
import type { LoginFormData } from '@src/types/login'
import { handleError } from '@src/utils/error'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'

export function LoginForm() {
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '' },
  })
  const navigate = useNavigate()

  const phoneNumber = loginForm.watch('phone')

  const { mutateAsync: login, isPending } = useMutation({
    mutationKey: ['owner-login', phoneNumber],
    mutationFn: () => loginOwnerWithPhone(phoneNumber),
    onError: (error) => {
      handleError(error)
    },
    onSuccess: (data) => {
      toast.success(data.data.message)
      navigate(PATHNAME.PHONE_VERIFICATION, { state: { phoneNumber } })
    },
  })

  const onSubmit = async () => {
    await login()
  }

  return (
    <div className="flex flex-col gap-6 max-w-96 mx-auto h-dvh items-center justify-center">
      <Form {...loginForm}>
        <form onSubmit={loginForm.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold">Login</h1>
              <div className="text-center text-sm">
                Please enter your phone number to login
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <FormField
                control={loginForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel htmlFor="phone">Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        id="phone"
                        placeholder="Enter your phone number (e.g. +84123456789)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <Button
                type="submit"
                variant="default"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? <Loader2 className="animate-spin" /> : 'Login'}
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
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our{' '}
        <Link to="#">Terms of Service</Link> and{' '}
        <Link to="#">Privacy Policy</Link>.
      </div>
    </div>
  )
}
