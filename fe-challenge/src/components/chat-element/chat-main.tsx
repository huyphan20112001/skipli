import { ChatSidebar } from '@src/components/chat-element/chat-sidebar'
import { useChat } from '@src/hooks/useChat'
import { useSocketAuth } from '@src/hooks/useSocket'
import type { ChatMessage } from '@src/lib/socket-service'
import { cn } from '@src/lib/utils'
import type { Employee } from '@src/types/employee'
import { ArrowRight, ImageIcon, MoreVertical } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface MessageBubbleProps {
  message: ChatMessage
  isUserMessage: boolean
}

const MessageBubble = ({ message, isUserMessage }: MessageBubbleProps) => (
  <div
    className={cn('flex items-start gap-3', isUserMessage ? 'justify-end' : '')}
  >
    {!isUserMessage && (
      <Avatar className="h-8 w-8">
        <AvatarImage
          src={message.senderId ? '/placeholder.svg' : '/placeholder.svg'}
          alt="User Avatar"
        />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    )}
    <div
      className={cn(
        'max-w-[70%] rounded-lg p-3',
        isUserMessage
          ? 'bg-primary text-primary-foreground rounded-br-none'
          : 'rounded-bl-none bg-gray-100',
      )}
    >
      <p className="text-sm text-accent">{message.message}</p>
      <p className="text-xs mt-1 opacity-70 text-right text-accent">
        {new Date(message.timestamp).toLocaleTimeString()}
      </p>
    </div>
  </div>
)

export function ChatMain({ participantId }: { participantId?: string }) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const { messages, isLoading, sendMessage } = useChat(participantId)
  const [input, setInput] = useState('')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  return (
    <div className="flex flex-1 flex-col rounded-lg shadow-sm">
      <div className="flex items-center justify-between border border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg" alt="Chat user" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">
              {participantId
                ? `Chat ${participantId}`
                : 'Select a conversation'}
            </h2>
            <p className="text-muted-foreground text-sm">Online</p>
          </div>
        </div>
        <MoreVertical className="text-muted-foreground h-5 w-5 cursor-pointer" />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-muted-foreground text-center">No messages</div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isUserMessage={msg.senderId !== participantId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-3 border border-t p-4">
        <ImageIcon className="text-muted-foreground h-5 w-5 cursor-pointer" />
        <Input
          placeholder="Enter a message"
          className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Button size="icon" className="rounded-full" onClick={handleSend}>
          <ArrowRight />
        </Button>
      </div>
    </div>
  )
}

const MessagesScreen = () => {
  const { socketService } = useSocketAuth()
  const [activeParticipant, setActiveParticipant] = useState<
    string | undefined
  >(undefined)

  const handleOpenChat = useCallback(
    async (employeeId: Employee['id'] | string) => {
      if (!socketService.connected) {
        const token = localStorage.getItem('token') || ''
        try {
          await socketService.connect(token)
        } catch (err) {
          console.error('Failed to connect socket before joining chat', err)
          return
        }
      }

      socketService.joinChatRoom(String(employeeId))
      setActiveParticipant(String(employeeId))
      console.log('Joined chat room with', employeeId)
    },
    [socketService],
  )

  return (
    <div className="flex h-full">
      <ChatSidebar onOpenChat={(id) => handleOpenChat(id as Employee['id'])} />
      <ChatMain participantId={activeParticipant} />
    </div>
  )
}

export default MessagesScreen
