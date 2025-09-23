export type BaseAPIResponse = {
  message: string
  success: boolean
}

export type APIResponseUnion<T> =
  | (BaseAPIResponse & {
      data: T
    })
  | (BaseAPIResponse & {
      data?: undefined
    })

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResponse = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type FilterResponse = {
  search?: string
}
