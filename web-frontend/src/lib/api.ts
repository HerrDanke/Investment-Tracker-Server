import axios from 'axios'
import type { AssetWithTags, TransactionWithAsset, Tag, Summary, CreateAsset, CreateTransaction, CreateTag } from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 — clear session and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const assetApi = {
  list: () => api.get<AssetWithTags[]>('/assets').then(r => r.data),
  get: (id: number) => api.get<AssetWithTags>(`/assets/${id}`).then(r => r.data),
  create: (data: CreateAsset) => api.post('/assets', data).then(r => r.data),
  update: (id: number, data: Partial<CreateAsset>) => api.patch(`/assets/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/assets/${id}`).then(r => r.data),
  addTag: (assetId: number, tagId: number) => api.post(`/assets/${assetId}/tags`, { tag_id: tagId }).then(r => r.data),
  removeTag: (assetId: number, tagId: number) => api.delete(`/assets/${assetId}/tags/${tagId}`).then(r => r.data),
}

export const transactionApi = {
  list: (params?: { asset_id?: number; txn_type?: string; start_date?: string; end_date?: string }) =>
    api.get<TransactionWithAsset[]>('/transactions', { params }).then(r => r.data),
  get: (id: number) => api.get<TransactionWithAsset>(`/transactions/${id}`).then(r => r.data),
  create: (data: CreateTransaction) => api.post('/transactions', data).then(r => r.data),
  update: (id: number, data: Partial<CreateTransaction>) => api.patch(`/transactions/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/transactions/${id}`).then(r => r.data),
}

export const tagApi = {
  list: () => api.get<Tag[]>('/tags').then(r => r.data),
  get: (id: number) => api.get<Tag>(`/tags/${id}`).then(r => r.data),
  create: (data: CreateTag) => api.post('/tags', data).then(r => r.data),
  update: (id: number, data: Partial<CreateTag>) => api.patch(`/tags/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/tags/${id}`).then(r => r.data),
}

export const summaryApi = {
  get: () => api.get<Summary>('/summary').then(r => r.data),
}

export const dataApi = {
  export: () => api.get('/export').then(r => r.data),
  import: (data: unknown) => api.post('/import', data).then(r => r.data),
}

export default api
