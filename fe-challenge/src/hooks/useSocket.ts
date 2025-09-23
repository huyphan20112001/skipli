import { useEffect, useState, useCallback, useRef } from 'react'
import { SocketService } from '@src/lib/socket-service'

export const useSocket = () => {
  const [socketService] = useState(() => SocketService.getInstance())
  const [isConnected, setIsConnected] = useState<boolean>(
    socketService.connected,
  )
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)

  const connect = useCallback(
    async (token: string) => {
      try {
        setConnectionError(null)
        await socketService.connect(token)
        setIsConnected(true)
      } catch (error: any) {
        console.error('Socket connect error', error)
        setConnectionError(error?.message || 'Connection failed')
        setIsConnected(false)
        throw error
      }
    },
    [socketService],
  )

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = window.setTimeout(() => {
      const token = localStorage.getItem('token') || ''
      if (token && !socketService.connected) {
        connect(token).catch(() => {})
      }
    }, 5000)
  }, [connect, socketService])

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    if (token) {
      connect(token).catch(() => {})
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      socketService.disconnect()
      setIsConnected(false)
    }
  }, [socketService, connect])

  useEffect(() => {
    if (connectionError && !isConnected) {
      scheduleReconnect()
    }
  }, [connectionError, isConnected, scheduleReconnect])

  return {
    socketService,
    isConnected,
    connectionError,
    reconnect: () => {
      const token = localStorage.getItem('token') || ''
      if (token) connect(token).catch(() => {})
    },
  }
}

export const useSocketAuth = () => {
  const { socketService, isConnected, connectionError, reconnect } = useSocket()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token && isConnected)
  }, [isConnected])

  const refreshToken = useCallback(async () => {
    return Promise.reject(new Error('refreshToken not implemented'))
  }, [reconnect])

  return {
    socketService,
    isConnected,
    isAuthenticated,
    connectionError,
    refreshToken,
    reconnect,
  }
}
