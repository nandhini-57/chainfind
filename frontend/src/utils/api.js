import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
export const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_BASE_URL, timeout: 30000 })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('cf_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cf_token')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default api
export const setToken = t => localStorage.setItem('cf_token', t)
export const getToken = () => localStorage.getItem('cf_token')
export const clearToken = () => localStorage.removeItem('cf_token')
