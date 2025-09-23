import { getMe } from '@src/services/auth'
import { useQuery } from '@tanstack/react-query'

export const useUserDetails = () => {
  const token = localStorage.getItem('token') || ''
  return useQuery({
    queryKey: ['userDetails'],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!token,
  })
}
