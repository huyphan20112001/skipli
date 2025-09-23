import { Loader2 } from 'lucide-react'

const DashboardLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 m-auto h-dvh">
      <Loader2 className="animate-spin size-12" />
      <p>Loading...</p>
    </div>
  )
}

export default DashboardLoader
