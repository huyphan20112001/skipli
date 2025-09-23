import { socket } from '@src/lib/socket'

export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  message: string
  timestamp: string | number | Date
  messageType?: 'owner-to-employee' | 'employee-to-owner'
  isRead?: boolean
}

export interface OnlineUser {
  userId: string
  role?: 'owner' | 'employee'
  isOnline?: boolean
}

export class SocketService {
  private static instance: SocketService
  private isConnected = false
  private currentRoom: string | null = null

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      socket.auth = { token }

      const onConnect = () => {
        this.isConnected = true
        socket.off('connect_error', onConnectError)
        resolve()
      }

      const onConnectError = (error: any) => {
        this.isConnected = false
        socket.off('connect', onConnect)
        reject(error)
      }

      socket.once('connect', onConnect)
      socket.once('connect_error', onConnectError)

      socket.connect()
    })
  }

  disconnect(): void {
    if (this.currentRoom) {
      this.leaveRoom(this.currentRoom)
    }
    socket.disconnect()
    this.isConnected = false
  }

  joinChatRoom(participantId: string): void {
    if (!this.isConnected) {
      return
    }
    socket.emit('join-chat-room', { participantId })
    this.currentRoom = participantId
  }

  leaveRoom(participantId: string): void {
    if (!this.isConnected) return
    socket.emit('leave-chat-room', { participantId })
    if (this.currentRoom === participantId) this.currentRoom = null
  }

  sendMessage(receiverId: string, message: string): void {
    if (!this.isConnected) return
    socket.emit('send-message', { receiverId, message })
  }

  getMessages(participantId: string, limit = 50): void {
    if (!this.isConnected) return
    socket.emit('get-messages', { participantId, limit })
  }

  markMessagesAsRead(senderId: string): void {
    if (!this.isConnected) return
    socket.emit('mark-messages-read', { senderId })
  }

  deleteMessage(messageId: string): void {
    if (!this.isConnected) return
    socket.emit('delete-message', { messageId })
  }

  getOnlineUsers(): void {
    if (!this.isConnected) return
    socket.emit('get-online-users')
  }

  getUnreadCount(): void {
    if (!this.isConnected) return
    socket.emit('get-unread-count')
  }

  onMessageReceived(
    callback: (data: { message: ChatMessage; roomName: string }) => void,
  ): void {
    socket.on('message-received', callback)
  }

  onNewMessageNotification(
    callback: (data: { message: ChatMessage; roomName: string }) => void,
  ): void {
    socket.on('new-message-notification', callback)
  }

  onMessagesHistory(
    callback: (data: {
      messages: ChatMessage[]
      participantId: string
      count: number
    }) => void,
  ): void {
    socket.on('messages-history', callback)
  }

  onOnlineUsers(callback: (data: { users: OnlineUser[] }) => void): void {
    socket.on('online-users', callback)
  }

  onUnreadCount(callback: (data: { count: number }) => void): void {
    socket.on('unread-count', callback)
  }

  onError(callback: (error: { message: string; details?: any }) => void): void {
    socket.on('error', callback)
  }

  removeAllListeners(): void {
    socket.removeAllListeners()
  }

  get connected(): boolean {
    return this.isConnected || socket.connected
  }
}
