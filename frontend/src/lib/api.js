import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
  Object.assign(config.headers, getAuthHeaders())
  return config
})


