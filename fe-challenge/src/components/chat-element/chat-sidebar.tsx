import { useState, useMemo } from 'react'
import { Search, User, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { cn } from '@src/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getChatParticipants, getEmployeeList } from '@src/services/employee'
import type { Employee } from '@src/types/employee'
import { useUserDetails } from '@src/hooks/useUserDetails'

interface ChatContactProps {
  id: string
  name: string
  avatarSrc: string
  lastMessage: string
  timestamp: string
  hasUnread: boolean
  isActive: boolean
  onClick: (id: string) => void
}

const ChatContact = ({
  id,
  name,
  avatarSrc,
  lastMessage,
  timestamp,
  hasUnread,
  isActive,
  onClick,
}: ChatContactProps) => (
  <div
    className={cn(
      'hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors',
      isActive && 'bg-muted',
    )}
    onClick={() => onClick(id)}
  >
    <Avatar>
      <AvatarImage src={avatarSrc} alt={name} />
      <AvatarFallback>{name.charAt(0)}</AvatarFallback>
    </Avatar>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground text-xs">{timestamp}</span>
      </div>
      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <p className="truncate">{lastMessage}</p>
        {hasUnread && <div className="ml-2 h-2 w-2 rounded-full bg-blue-500" />}
      </div>
    </div>
  </div>
)

export function ChatSidebar({
  onOpenChat,
}: {
  onOpenChat?: (id: string) => void
}) {
  const [activeChatId, setActiveChatId] = useState('')
  const { data: userDetails } = useUserDetails()
  const user = userDetails?.data?.data?.user

  const isOwner = user?.role === 'owner'

  const { data: chatParticipants, isLoading: isLoadingChatParticipants } =
    useQuery({
      queryKey: ['employees'],
      queryFn: () => getChatParticipants(),
      enabled: !!localStorage.getItem('token') && user?.role === 'employee',
    })
  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () =>
      getEmployeeList({
        page: 1,
        limit: 10,
        search: '',
      }),
    enabled: !!localStorage.getItem('token') && user?.role === 'employee',
  })

  const employees: Employee[] = isOwner
    ? (employeesData as any)?.data?.data?.employees || []
    : (chatParticipants as any)?.data?.data?.participants || []

  const chatContacts = useMemo(
    () =>
      employees.map((emp) => {
        const e = emp as any
        const name =
          e.name ||
          e.fullName ||
          `${(e.firstName || '').toString()} ${(
            e.lastName || ''
          ).toString()}`.trim() ||
          e.email ||
          'Unknown'
        return {
          id: String(e.id),
          name,
          avatarSrc: e.avatarUrl || '/placeholder.svg?height=40&width=40',
          lastMessage: e.lastMessage || '',
          timestamp: e.lastActive || '',
          hasUnread: !!e.unreadCount,
        }
      }),
    [employees],
  )

  const handleClick = (id: string) => {
    setActiveChatId(id)
    onOpenChat?.(id)
  }

  return (
    <div className="flex w-80 flex-col border border-r p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat</h1>
        <Search className="text-muted-foreground h-5 w-5 cursor-pointer" />
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {isLoadingChatParticipants || isLoadingEmployees ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : chatContacts.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No contacts
          </div>
        ) : (
          chatContacts.map((contact) => (
            <ChatContact
              key={contact.id}
              {...contact}
              isActive={contact.id === activeChatId}
              onClick={handleClick}
            />
          ))
        )}
      </div>

      {/* <div className="mt-6">
        <Button className="w-full">New chat</Button>
      </div> */}
    </div>
  )
}
