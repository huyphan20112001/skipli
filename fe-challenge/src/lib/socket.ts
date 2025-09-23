import { io } from 'socket.io-client'

const URL = import.meta.env.VITE_API_URL || 'http://localhost:2001'
console.log('🚀 ~ URL => ', URL)

export const socket = io(URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem('token') || '',
  },
  transports: ['websocket'],
})
