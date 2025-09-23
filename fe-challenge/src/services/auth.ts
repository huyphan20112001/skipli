import { API_ENDPOINTS } from '@src/constants/api-endpoint'
import api from '@src/lib/api'
import type { APIResponseUnion, BaseAPIResponse } from '@src/types/common'

export const loginOwnerWithPhone = async (phoneNumber: string) => {
  return api.post<BaseAPIResponse>(API_ENDPOINTS.OWNER_LOGIN, { phoneNumber })
}

export const ownerVerifyCode = async (
  phoneNumber: string,
  accessCode: string,
) => {
  return api.post<APIResponseUnion<{ token: string; ownerId: string }>>(
    API_ENDPOINTS.OWNER_VERIFY,
    {
      phoneNumber,
      accessCode,
    },
  )
}

export const getMe = async () => {
  return api.get<APIResponseUnion<{ user: any }>>('/auth/me')
}
