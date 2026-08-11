import { apiFetch } from './base'
import type {
  AuthUser,
  Client,
  Category,
  Supplier,
  Product,
  Order,
  StockMovement,
  Settings,
  DashboardStats,
} from '../types'

// ── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    apiFetch.post<{ token: string; user: AuthUser }>('/auth/login', { username, password }),
  setup: (name: string, username: string, password: string) =>
    apiFetch.post<{ token: string; user: AuthUser }>('/auth/setup', { name, username, password }),
  me: () => apiFetch.get<AuthUser>('/auth/me'),
  getUsers: () => apiFetch.get<AuthUser[]>('/auth/users'),
  createUser: (data: { name: string; username: string; password: string; role: string }) =>
    apiFetch.post<AuthUser>('/auth/users', data),
  deleteUser: (id: string) => apiFetch.delete(`/auth/users/${id}`),
}

// ── Clients ─────────────────────────────────────────────────────────────────
export const clientApi = {
  list: (search?: string) =>
    apiFetch.get<Client[]>(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  get: (id: string) => apiFetch.get<Client>(`/clients/${id}`),
  create: (data: Partial<Client>) => apiFetch.post<Client>('/clients', data),
  update: (id: string, data: Partial<Client>) => apiFetch.put<Client>(`/clients/${id}`, data),
  remove: (id: string) => apiFetch.delete<{ message: string }>(`/clients/${id}`),
}

// ── Categories ───────────────────────────────────────────────────────────────
export const categoryApi = {
  list: () => apiFetch.get<Category[]>('/categories'),
  create: (data: { name: { fr: string; en: string } }) =>
    apiFetch.post<Category>('/categories', data),
  update: (id: string, data: { name: { fr: string; en: string } }) =>
    apiFetch.put<Category>(`/categories/${id}`, data),
  remove: (id: string) => apiFetch.delete<{ message: string }>(`/categories/${id}`),
}

// ── Suppliers ────────────────────────────────────────────────────────────────
export const supplierApi = {
  list: (search?: string) =>
    apiFetch.get<Supplier[]>(`/suppliers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  create: (data: Partial<Supplier>) => apiFetch.post<Supplier>('/suppliers', data),
  update: (id: string, data: Partial<Supplier>) =>
    apiFetch.put<Supplier>(`/suppliers/${id}`, data),
  remove: (id: string) => apiFetch.delete<{ message: string }>(`/suppliers/${id}`),
}

// ── Products ─────────────────────────────────────────────────────────────────
export const productApi = {
  list: (search?: string, category?: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    const qs = params.toString()
    return apiFetch.get<Product[]>(`/products${qs ? `?${qs}` : ''}`)
  },
  get: (id: string) => apiFetch.get<Product>(`/products/${id}`),
  create: (data: Partial<Product>) => apiFetch.post<Product>('/products', data),
  update: (id: string, data: Partial<Product>) =>
    apiFetch.put<Product>(`/products/${id}`, data),
  remove: (id: string) => apiFetch.delete<{ message: string }>(`/products/${id}`),
}

// ── Orders ───────────────────────────────────────────────────────────────────
export const orderApi = {
  list: (params?: { client?: string; from?: string; to?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return apiFetch.get<Order[]>(`/orders${qs ? `?${qs}` : ''}`)
  },
  get: (id: string) => apiFetch.get<Order>(`/orders/${id}`),
  create: (data: {
    clientId?: string
    items: { productId: string; qty: number; discount?: number }[]
    note?: string
  }) => apiFetch.post<Order>('/orders', data),
  stats: () => apiFetch.get<DashboardStats>('/orders/stats'),
}

// ── Stock ────────────────────────────────────────────────────────────────────
export const stockApi = {
  movements: (params?: { product?: string; type?: string; from?: string; to?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return apiFetch.get<StockMovement[]>(`/stock/movements${qs ? `?${qs}` : ''}`)
  },
  alerts: () => apiFetch.get<Product[]>('/stock/alerts'),
  delivery: (data: { productId: string; quantity: number; note?: string }) =>
    apiFetch.post<{ movement: StockMovement; product: Product }>('/stock/delivery', data),
  adjust: (data: { productId: string; quantity: number; type: 'in' | 'out'; note?: string }) =>
    apiFetch.post<{ movement: StockMovement }>('/stock/adjust', data),
}

// ── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => apiFetch.get<Settings>('/settings'),
  update: (data: Partial<Settings>) => apiFetch.put<Settings>('/settings', data),
}
