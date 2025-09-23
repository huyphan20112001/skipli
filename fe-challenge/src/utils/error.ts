import { isAxiosError } from 'axios'
import { toast } from 'sonner'

export const handleError = (error: unknown) => {
  if (isAxiosError(error)) {
    console.log('🚀 ~ handleError ~ error1  => ', error)

    const message = error.response?.data?.message || error.message
    toast.error(message)
  } else if (error instanceof Error) {
    console.log('🚀 ~ handleError ~ error2 => ', error)
    toast.error(error.message)
  } else {
    toast.error('An unexpected error occurred')
  }
}
