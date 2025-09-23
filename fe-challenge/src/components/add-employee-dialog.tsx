import { zodResolver } from '@hookform/resolvers/zod'
import { queryClient } from '@src/lib/query-client'
import { employeeSchema } from '@src/schemas/employee'
import { createEmployee, updateEmployee } from '@src/services/employee'
import type { AddEmployeeFormData, Employee } from '@src/types/employee'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from './ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { handleError } from '@src/utils/error'

const AddEmployeeDialog = ({
  onClose,
  isEdit,
  employeeData,
  title = 'Add Employee',
  buttonText = 'Add Employee',
}: {
  onClose: () => void
  isEdit?: boolean
  title?: string
  employeeData?: Employee
  buttonText?: string
}) => {
  const createEmployeeForm = useForm<AddEmployeeFormData>({
    defaultValues: {
      name: employeeData?.name || '',
      email: employeeData?.email || '',
      department: employeeData?.department || '',
    },
    resolver: zodResolver(employeeSchema),
  })
  const { mutateAsync: createNewEmployee, isPending: isCreating } = useMutation(
    {
      mutationKey: ['create-employee'],
      mutationFn: async (data: AddEmployeeFormData) => {
        return createEmployee(data)
      },
      onError: (error) => {
        handleError(error)
      },
      onSuccess: ({ data }) => {
        toast.success(data.message)
        queryClient.invalidateQueries({ queryKey: ['employees'] })
        createEmployeeForm.reset()
        onClose()
      },
    },
  )
  const { mutateAsync: updateEmployeeMutation, isPending: isUpdating } =
    useMutation({
      mutationKey: ['update-employee'],
      mutationFn: async (data: AddEmployeeFormData) => {
        return updateEmployee({ employeeId: employeeData?.id || '', ...data })
      },
      onError: (error) => {
        handleError(error)
      },
      onSuccess: ({ data }) => {
        toast.success(data.message)
        queryClient.invalidateQueries({ queryKey: ['employees'] })
        onClose()
      },
    })

  const onSubmit = async (data: AddEmployeeFormData) => {
    if (isEdit) {
      await updateEmployeeMutation(data)
    } else {
      await createNewEmployee(data)
    }
  }

  return (
    <DialogContent>
      <DialogHeader className="space-y-2">
        <DialogTitle>
          <span className="text-lg font-semibold">{title}</span>
        </DialogTitle>
        <DialogDescription>
          <Form {...createEmployeeForm}>
            <form
              className="space-y-4"
              onSubmit={createEmployeeForm.handleSubmit(onSubmit)}
            >
              <FormField
                name="name"
                control={createEmployeeForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="email"
                control={createEmployeeForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="department"
                control={createEmployeeForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Department" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="mt-4 float-right min-w-32"
                variant="default"
              >
                {isCreating || isUpdating ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  buttonText
                )}
              </Button>
            </form>
          </Form>
        </DialogDescription>
      </DialogHeader>
    </DialogContent>
  )
}

export default AddEmployeeDialog
