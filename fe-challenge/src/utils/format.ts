export const formatToTitleCase = (text: string | null | undefined) => {
  if (!text) return ''

  const spacedText = text.replace(/([a-z])([A-Z])/g, '$1 $2')

  return spacedText
    .split(/[_\-\s]+/)
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
