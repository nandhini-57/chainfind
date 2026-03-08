import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 30000 })

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
