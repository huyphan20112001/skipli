import { globalRouter } from '@src/utils/global-router'
import { isTokenExpired } from '@src/utils/token'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2001'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      if (isTokenExpired(token)) {
        globalRouter.logout?.()
        return Promise.reject(new Error('Token expired'))
      }

      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      globalRouter.logout?.()
    }
    return Promise.reject(error)
  },
)

export default api
