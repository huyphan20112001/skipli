import { useEffect, useState, useCallback } from 'react'
import {
  SocketService,
  type ChatMessage,
  type OnlineUser,
} from '@src/lib/socket-service'

export const useChat = (participantId?: string) => {
  const socketService = SocketService.getInstance()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!participantId) return
    if (socketService.connected) {
      setIsLoading(true)
      socketService.joinChatRoom(participantId)
      socketService.getMessages(participantId)
    }

    return () => {
      if (participantId) socketService.leaveRoom(participantId)
    }
  }, [participantId, socketService])

  useEffect(() => {
    const handleMessageReceived = (data: {
      message: ChatMessage
      roomName: string
    }) => {
      setMessages((prev) => [...prev, data.message])
    }

    const handleMessagesHistory = (data: {
      messages: ChatMessage[]
      participantId: string
      count: number
    }) => {
      if (data.participantId === participantId) {
        setMessages(data.messages || [])
        setIsLoading(false)
      }
    }

    const handleOnlineUsers = (data: { users: OnlineUser[] }) => {
      setOnlineUsers(data.users || [])
    }

    const handleUnreadCount = (data: { count: number }) => {
      setUnreadCount(data.count || 0)
    }

    const handleError = (err: any) => {
      console.error('Socket error', err)
      setIsLoading(false)
    }

    socketService.onMessageReceived(handleMessageReceived)
    socketService.onMessagesHistory(handleMessagesHistory)
    socketService.onOnlineUsers(handleOnlineUsers)
    socketService.onUnreadCount(handleUnreadCount)
    socketService.onError(handleError)

    if (socketService.connected) {
      socketService.getOnlineUsers()
      socketService.getUnreadCount()
    }

    return () => {
      socketService.removeAllListeners()
    }
  }, [participantId, socketService])

  const sendMessage = useCallback(
    (message: string) => {
      if (!participantId || !message.trim()) return
      socketService.sendMessage(participantId, message.trim())
    },
    [participantId, socketService],
  )

  const markAsRead = useCallback(
    (senderId: string) => {
      socketService.markMessagesAsRead(senderId)
    },
    [socketService],
  )

  const deleteMessage = useCallback(
    (messageId: string) => {
      socketService.deleteMessage(messageId)
    },
    [socketService],
  )

  return {
    messages,
    onlineUsers,
    unreadCount,
    isLoading,
    sendMessage,
    markAsRead,
    deleteMessage,
  }
}
