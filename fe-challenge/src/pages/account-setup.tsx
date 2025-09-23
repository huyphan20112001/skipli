import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@src/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@src/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@src/components/ui/form'
import { Input } from '@src/components/ui/input'
import { setupAccountSchema } from '@src/schemas/employee'
import { setupEmployeeAccount, validateSetupToken } from '@src/services/employee'
import type { SetupAccountFormData } from '@src/types/employee'
import { handleError } from '@src/utils/error'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'

const AccountSetup = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  console.log('🚀 ~ AccountSetup ~ token => ', token)

  const setupAccountForm = useForm<SetupAccountFormData>({
    defaultValues: {
      token: token,
    },
    resolver: zodResolver(setupAccountSchema),
  })

  const { data: tokenValidation } = useQuery({
    queryKey: ['setupAccount', token],
    enabled: !!token,
    queryFn: () => validateSetupToken(token),
  })
  console.log('🚀 ~ AccountSetup ~ tokenValidation => ', tokenValidation)
  const { mutateAsync: setupAccount } = useMutation({
    mutationKey: ['setupAccount'],
    mutationFn: setupEmployeeAccount,
    onError: (error) => {
      handleError(error)
    },
    onSuccess: ({ data }) => {
      console.log('🚀 ~ AccountSetup ~ data => ', data)
      localStorage.setItem('token', data.data?.token || '')
    },
  })

  const onSubmit = async (data: SetupAccountFormData) => {
    if (!tokenValidation?.data.success) {
      return
    } else {
      await setupAccount({
        token: data.token,
        username: data.username,
        password: data.password,
      })
    }
  }

  return (
    <Card className="mx-auto mt-20 w-full max-w-md">
      <CardHeader>
        <CardTitle>Set Up Your Account</CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...setupAccountForm}>
          <form
            onSubmit={setupAccountForm.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={setupAccountForm.control}
              name="username"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel htmlFor="username">Username</FormLabel>
                  <FormControl>
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={setupAccountForm.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      id="password"
                      placeholder="Enter your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="btn btn-primary mt-4 float-right">
              Set Up Account
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default AccountSetup
