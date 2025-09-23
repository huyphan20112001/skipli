import AddEmployeeDialog from '@src/components/add-employee-dialog'
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
import { deleteEmployee, getEmployeeList } from '@src/services/employee'
import { handleError } from '@src/utils/error'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

const columns = [
  { field: 'id', headerName: 'ID' },
  { field: 'name', headerName: 'Name' },
  { field: 'email', headerName: 'Email' },
  { field: 'status', headerName: 'Status' },
]

const ManageEmployees = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ['employees'],
    queryFn: () =>
      getEmployeeList({
        page: 1,
        limit: 10,
        search: '',
      }),
  })
  console.log("🚀 ~ ManageEmployees ~ data => ", data)
  const { mutateAsync: deleteEmployeeMutation, isPending } = useMutation({
    mutationKey: ['delete-employee'],
    mutationFn: (employeeId: string) => deleteEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (error) => {
      handleError(error)
    },
  })
  const employees = data?.data.data?.employees || []

  const handleDelete = async (employeeId: string) => {
    await deleteEmployeeMutation(employeeId)
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-4">Manage Employees</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger>
            <Button variant="default" className="mb-4">
              Add Employee
            </Button>
          </DialogTrigger>
          <AddEmployeeDialog onClose={() => setIsAddDialogOpen(false)} />
        </Dialog>
      </div>
      <div className="mb-5">
        <Input
          type="text"
          placeholder="Search employees..."
          className="px-3 py-2 max-w-96"
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
          {employees.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.isActive ? 'Active' : 'Inactive'}</TableCell>
              <TableCell className="p-4 align-middle space-x-2.5">
                <Dialog>
                  <DialogTrigger>
                    <Button variant="outline">Edit</Button>
                  </DialogTrigger>
                  <AddEmployeeDialog
                    isEdit
                    onClose={() => setIsAddDialogOpen(false)}
                    employeeData={row}
                    title="Edit Employee"
                    buttonText="Save Changes"
                  />
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger>
                    <Button variant="destructive">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      Are you sure you want to delete this employee?
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                      </AlertDialogTrigger>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(row.id)}
                        className="min-w-24"
                        disabled={isPending}
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

export default ManageEmployees
