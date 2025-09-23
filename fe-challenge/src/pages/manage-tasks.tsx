import AddTaskDialog from '@src/components/add-task-dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from '@src/components/ui/alert-dialog'
import { Button } from '@src/components/ui/button'
import { Dialog, DialogTrigger } from '@src/components/ui/dialog'
import { Input } from '@src/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@src/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/components/ui/table'
import { queryClient } from '@src/lib/query-client'
import { deleteTask, getTaskList } from '@src/services/task'
import { formatToTitleCase } from '@src/utils/format'
import { handleError } from '@src/utils/error'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

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

  const { data } = useQuery({
    queryKey: ['tasks', searchTerm],
    queryFn: () =>
      getTaskList({
        page: 1,
        limit: 10,
        search: searchTerm,
      }),
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

  const tasks = data?.data.data?.tasks || []

  const handleDelete = async (taskId: string) => {
    await deleteTaskMutation(taskId)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

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
              <TableCell>{row.assignedTo || 'Unassigned'}</TableCell>
              <TableCell>{formatToTitleCase(row.priority)}</TableCell>
              <TableCell>{formatToTitleCase(row.status)}</TableCell>
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
                        className='min-w-24'
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
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export default ManageTasks
