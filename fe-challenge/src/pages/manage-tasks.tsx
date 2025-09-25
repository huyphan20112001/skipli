import { getEmployeeById } from '@src/services/employee'
import AddTaskDialog from '@src/components/add-task-dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from '@src/components/ui/alert-dialog'
import BasePagination from '@src/components/ui/base-pagination'
import { Button } from '@src/components/ui/button'
import { Dialog, DialogTrigger } from '@src/components/ui/dialog'
import { Input } from '@src/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/components/ui/table'
import usePagination from '@src/hooks/use-pagination'
import { useUserDetails } from '@src/hooks/useUserDetails'
import { queryClient } from '@src/lib/query-client'
import {
  deleteTask,
  getEmployeeAssignedTasks,
  getTaskList,
  updateTask,
} from '@src/services/task'
import { handleError } from '@src/utils/error'
import { formatToTitleCase } from '@src/utils/format'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

const columns = [
  { field: 'id', headerName: 'ID' },
  { field: 'title', headerName: 'Title' },
  { field: 'description', headerName: 'Description' },
  { field: 'assignedTo', headerName: 'Assigned To' },
  { field: 'priority', headerName: 'Priority' },
  { field: 'status', headerName: 'Status' },
]

const ManageTasks = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const token = localStorage.getItem('token') || ''

  const { data: userDetails } = useUserDetails()
  const user = userDetails?.data.data?.user
  const isOwner = user?.role === 'owner'
  const { page, setPage, limit } = usePagination({ initLimit: 5 })

  const { data } = useQuery({
    queryKey: ['tasks', page, limit, searchTerm],
    queryFn: () =>
      getTaskList({
        page,
        limit,
        search: searchTerm,
      }),
    enabled: !!token && isOwner,
  })
  const { data: assignedTasks } = useQuery({
    queryKey: ['assigned-tasks'],
    queryFn: () => getEmployeeAssignedTasks(),
    enabled: !!token && !isOwner,
  })

  const { mutateAsync: deleteTaskMutation, isPending } = useMutation({
    mutationKey: ['delete-task'],
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => {
      handleError(error)
    },
  })

  const { mutateAsync: completeTaskMutation, isPending: isCompleting } =
    useMutation({
      mutationKey: ['complete-task'],
      mutationFn: (taskId: string) =>
        updateTask({ taskId, status: 'completed' }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['assigned-tasks'] })
      },
    })

  const handleDelete = async (taskId: string) => {
    await deleteTaskMutation(taskId)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const tasks = data?.data?.data?.tasks || assignedTasks?.data.data?.tasks || []
  const pagination = data?.data?.data?.pagination
  const totalPages = pagination?.totalPages || 0

  const [employeeEmailMap, setEmployeeEmailMap] = useState<
    Record<string, string | null>
  >({})
  const [resolvingIds, setResolvingIds] = useState<Record<string, boolean>>({})

  const resolveEmployeeEmail = async (employeeId?: string | null) => {
    if (!employeeId) return null
    if (employeeEmailMap[employeeId] !== undefined)
      return employeeEmailMap[employeeId]

    if (resolvingIds[employeeId]) return null

    setResolvingIds((s) => ({ ...s, [employeeId]: true }))
    try {
      const res = await getEmployeeById(employeeId)
      const email = res?.data?.data?.employee?.email || null
      setEmployeeEmailMap((m) => ({ ...m, [employeeId]: email }))
      return email
    } catch (err) {
      setEmployeeEmailMap((m) => ({ ...m, [employeeId]: null }))
      return null
    } finally {
      setResolvingIds((s) => {
        const copy = { ...s }
        delete copy[employeeId]
        return copy
      })
    }
  }

  useEffect(() => {
    const ids = new Set<string>()
    tasks.forEach((t: any) => {
      if (t.assignedTo) ids.add(t.assignedTo)
    })
    ;(assignedTasks?.data?.data?.tasks || []).forEach((t: any) => {
      if (t.assignedTo) ids.add(t.assignedTo)
    })

    ids.forEach((id) => {
      if (employeeEmailMap[id] === undefined && !resolvingIds[id]) {
        resolveEmployeeEmail(id).catch(() => {})
      }
    })
  }, [tasks, assignedTasks])

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-4">Manage Tasks</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger>
            <Button variant="default" className="mb-4">
              Add Task
            </Button>
          </DialogTrigger>
          <AddTaskDialog onClose={() => setIsAddDialogOpen(false)} />
        </Dialog>
      </div>
      <div className="mb-5">
        <Input
          type="text"
          placeholder="Search tasks..."
          className="px-3 py-2 max-w-96"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.field}>{column.headerName}</TableHead>
            ))}
            <TableHead key="actions">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.title}</TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell>
                {row.assignedTo ? (
                  employeeEmailMap[row.assignedTo] !== undefined ? (
                    employeeEmailMap[row.assignedTo] || 'Unknown'
                  ) : resolvingIds[row.assignedTo] ? (
                    <Loader2 className="inline-block h-4 w-4 animate-spin" />
                  ) : (
                    row.assignedTo
                  )
                ) : (
                  'Unassigned'
                )}
              </TableCell>
              <TableCell>{formatToTitleCase(row.priority)}</TableCell>
              <TableCell>{formatToTitleCase(row.status)}</TableCell>
              {isOwner && (
                <TableCell className="p-4 align-middle space-x-2.5">
                  <Dialog>
                    <DialogTrigger>
                      <Button variant="outline">Edit</Button>
                    </DialogTrigger>
                    <AddTaskDialog
                      isEdit
                      onClose={() => setIsAddDialogOpen(false)}
                      taskData={row}
                      title="Edit Task"
                      buttonText="Save Changes"
                    />
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <Button variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        Are you sure you want to delete this task?
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline">Cancel</Button>
                        </AlertDialogTrigger>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(row.id)}
                          disabled={isPending}
                          className="min-w-24"
                        >
                          {isPending ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            'Delete'
                          )}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              )}
              {!isOwner && (
                <TableCell>
                  <Button
                    onClick={() => completeTaskMutation(row.id)}
                    disabled={row.status === 'completed'}
                  >
                    {isCompleting ? (
                      <Loader2 className="animate-spin" />
                    ) : row.status === 'completed' ? (
                      'Completed'
                    ) : (
                      'Mark Complete'
                    )}
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <BasePagination
        currentPage={page}
        totalPages={totalPages}
        setPage={setPage}
      />
    </div>
  )
}

export default ManageTasks
