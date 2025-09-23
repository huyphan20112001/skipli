import { zodResolver } from '@hookform/resolvers/zod'
import { queryClient } from '@src/lib/query-client'
import { taskSchema } from '@src/schemas/task'
import { createTask, updateTask } from '@src/services/task'
import type { AddTaskFormData, Task } from '@src/types/task'
import { useMutation, useQuery } from '@tanstack/react-query'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Textarea } from './ui/textarea'
import { handleError } from '@src/utils/error'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { getEmployeeList } from '@src/services/employee'

const convertFirestoreTimestamp = (timestamp: any): string => {
  if (!timestamp) return ''

  if (timestamp._seconds !== undefined) {
    const date = new Date(timestamp._seconds * 1000)
    return date.toISOString().split('T')[0]
  }

  if (timestamp instanceof Date) {
    return timestamp.toISOString().split('T')[0]
  }

  if (typeof timestamp === 'string') {
    return new Date(timestamp).toISOString().split('T')[0]
  }

  return ''
}

const AddTaskDialog = ({
  onClose,
  isEdit,
  taskData,
  title = 'Add Task',
  buttonText = 'Add Task',
}: {
  onClose: () => void
  isEdit?: boolean
  title?: string
  taskData?: Task
  buttonText?: string
}) => {
  const createTaskForm = useForm<AddTaskFormData>({
    defaultValues: {
      title: taskData?.title || '',
      description: taskData?.description || '',
      assignedTo: taskData?.assignedTo || '',
      priority: taskData?.priority || 'medium',
      dueDate: convertFirestoreTimestamp(taskData?.dueDate),
    },
    resolver: zodResolver(taskSchema),
  })

  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployeeList({ page: 1, limit: 100 }),
  })

  const { mutateAsync: createNewTask, isPending: isCreating } = useMutation({
    mutationKey: ['create-task'],
    mutationFn: async (data: AddTaskFormData) => {
      return createTask(data)
    },
    onError: (error) => {
      handleError(error)
    },
    onSuccess: ({ data }) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      createTaskForm.reset()
      onClose()
    },
  })

  const { mutateAsync: updateTaskMutation, isPending: isUpdating } =
    useMutation({
      mutationKey: ['update-task'],
      mutationFn: async (data: AddTaskFormData) => {
        return updateTask({ taskId: taskData?.id || '', ...data })
      },
      onError: (error) => {
        handleError(error)
      },
      onSuccess: ({ data }) => {
        toast.success(data.message)
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        onClose()
      },
    })

  const onSubmit = async (data: AddTaskFormData) => {
    if (isEdit) {
      await updateTaskMutation(data)
    } else {
      await createNewTask(data)
    }
  }

  return (
    <DialogContent>
      <DialogHeader className="space-y-2">
        <DialogTitle>
          <span className="text-lg font-semibold">{title}</span>
        </DialogTitle>
        <DialogDescription>
          <Form {...createTaskForm}>
            <form
              className="space-y-4"
              onSubmit={createTaskForm.handleSubmit(onSubmit)}
            >
              <FormField
                name="title"
                control={createTaskForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="description"
                control={createTaskForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Task description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="assignedTo"
                control={createTaskForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingEmployees}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.data.data?.employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="priority"
                control={createTaskForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="dueDate"
                control={createTaskForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {field.value
                              ? new Date(field.value).toLocaleDateString(
                                  'vi-VN',
                                )
                              : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) => {
                              field.onChange(date?.toISOString().split('T')[0])
                            }}
                          />
                        </PopoverContent>
                      </Popover>
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

export default AddTaskDialog
