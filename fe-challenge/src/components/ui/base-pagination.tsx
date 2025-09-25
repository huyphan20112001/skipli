import { getPageItems } from '@src/utils/pagination'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination'
import type { Dispatch, SetStateAction } from 'react'

type PaginationProps = {
  totalPages: number
  currentPage: number
  setPage: Dispatch<SetStateAction<number>>
}

const BasePagination = ({
  totalPages,
  currentPage,
  setPage,
}: PaginationProps) => {
  console.log("🚀 ~ BasePagination ~ totalPages => ", totalPages)
  const handlePageClick = (p: number) => {
    if (p < 1 || p > totalPages) return
    setPage(p)
  }

  const handlePrev = () => {
    if (currentPage > 1) setPage((s) => s - 1)
  }

  const handleNext = () => {
    if (currentPage < totalPages) setPage((s) => s + 1)
  }

  if (totalPages <= 1) return null

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handlePrev()
            }}
          />
        </PaginationItem>

        {getPageItems(totalPages, currentPage).map((item, idx) => (
          <PaginationItem key={idx}>
            {item === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href="#"
                isActive={item === currentPage}
                onClick={(e) => {
                  e.preventDefault()
                  handlePageClick(item as number)
                }}
              >
                {item}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleNext()
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default BasePagination
