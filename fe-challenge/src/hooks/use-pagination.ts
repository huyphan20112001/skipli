import { useState } from 'react'

const usePagination = ({
  initialPage = 1,
  initLimit = 10,
}: { initialPage?: number; initLimit?: number } = {}) => {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initLimit)

  return { page, setPage, limit, setLimit }
}

export default usePagination
