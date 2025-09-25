export const getPageItems = (total: number, current: number) => {
  const items: Array<number | 'ellipsis'> = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) items.push(i)
    return items
  }

  items.push(1)

  const left = Math.max(2, current - 1)
  const right = Math.min(total - 1, current + 1)

  if (left > 2) items.push('ellipsis')

  for (let i = left; i <= right; i++) items.push(i)

  if (right < total - 1) items.push('ellipsis')

  items.push(total)
  return items
}
