import axiosInstance from './axios'
import type {
  AuthUser,
  Client,
  Category,
  Supplier,
  Product,
  Order,
  StockMovement,
  StockPosition,
  Settings,
  DashboardStats,
  Lot,
  Reception,
  Shift,
  ShiftSnapshot,
  StockAdjustment,
  Expense,
  ExpenseCategory,
} from '../types'

// ── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (username: string, password: string) => {
    const { data } = await axiosInstance.post<{ token: string; user: AuthUser }>('/auth/login', {
      username,
      password,
    })
    return data
  },
  setup: async (name: string, username: string, password: string) => {
    const { data } = await axiosInstance.post<{ token: string; user: AuthUser }>('/auth/setup', {
      name,
      username,
      password,
    })
    return data
  },
  me: async () => {
    const { data } = await axiosInstance.get<AuthUser>('/auth/me')
    return data
  },
  getUsers: async () => {
    const { data } = await axiosInstance.get<AuthUser[]>('/auth/users')
    return data
  },
  createUser: async (payload: {
    name: string
    username: string
    password: string
    role: string
  }) => {
    const { data } = await axiosInstance.post<AuthUser>('/auth/users', payload)
    return data
  },
  deleteUser: async (id: string) => {
    const { data } = await axiosInstance.delete(`/auth/users/${id}`)
    return data
  },
}

// ── Clients ─────────────────────────────────────────────────────────────────
export const clientApi = {
  list: async (search?: string) => {
    const { data } = await axiosInstance.get<Client[]>('/clients', {
      params: search ? { search } : undefined,
    })
    return data
  },
  get: async (id: string) => {
    const { data } = await axiosInstance.get<Client>(`/clients/${id}`)
    return data
  },
  create: async (payload: Partial<Client>) => {
    const { data } = await axiosInstance.post<Client>('/clients', payload)
    return data
  },
  update: async (id: string, payload: Partial<Client>) => {
    const { data } = await axiosInstance.put<Client>(`/clients/${id}`, payload)
    return data
  },
  remove: async (id: string) => {
    const { data } = await axiosInstance.delete<{ message: string }>(`/clients/${id}`)
    return data
  },
}

// ── Categories ───────────────────────────────────────────────────────────────
export const categoryApi = {
  list: async () => {
    const { data } = await axiosInstance.get<Category[]>('/categories')
    return data
  },
  create: async (payload: { name: string; code: string }) => {
    const { data } = await axiosInstance.post<Category>('/categories', payload)
    return data
  },
  update: async (id: string, payload: { name: string }) => {
    const { data } = await axiosInstance.put<Category>(`/categories/${id}`, payload)
    return data
  },
  remove: async (id: string) => {
    const { data } = await axiosInstance.delete<{ message: string }>(`/categories/${id}`)
    return data
  },
}

// ── Suppliers ────────────────────────────────────────────────────────────────
export const supplierApi = {
  list: async (search?: string) => {
    const { data } = await axiosInstance.get<Supplier[]>('/suppliers', {
      params: search ? { search } : undefined,
    })
    return data
  },
  create: async (payload: Partial<Supplier>) => {
    const { data } = await axiosInstance.post<Supplier>('/suppliers', payload)
    return data
  },
  update: async (id: string, payload: Partial<Supplier>) => {
    const { data } = await axiosInstance.put<Supplier>(`/suppliers/${id}`, payload)
    return data
  },
  remove: async (id: string) => {
    const { data } = await axiosInstance.delete<{ message: string }>(`/suppliers/${id}`)
    return data
  },
}

// ── Products ─────────────────────────────────────────────────────────────────
export const productApi = {
  list: async (opts?: {
    search?: string
    category?: string
    active?: 'true' | 'false' | 'all'
  }) => {
    const { data } = await axiosInstance.get<Product[]>('/products', { params: opts })
    return data
  },
  get: async (id: string) => {
    const { data } = await axiosInstance.get<Product>(`/products/${id}`)
    return data
  },
  create: async (payload: { name: string; qrCode?: string; category: string }) => {
    const { data } = await axiosInstance.post<Product>('/products', payload)
    return data
  },
  update: async (id: string, payload: { name?: string; qrCode?: string }) => {
    const { data } = await axiosInstance.put<Product>(`/products/${id}`, payload)
    return data
  },
  deactivate: async (id: string) => {
    const { data } = await axiosInstance.patch<Product>(`/products/${id}/deactivate`)
    return data
  },
  activate: async (id: string) => {
    const { data } = await axiosInstance.patch<Product>(`/products/${id}/activate`)
    return data
  },
  remove: async (id: string) => {
    const { data } = await axiosInstance.delete<{ message: string }>(`/products/${id}`)
    return data
  },
}

// ── Orders ───────────────────────────────────────────────────────────────────
export const orderApi = {
  list: async (params?: { client?: string; from?: string; to?: string }) => {
    const { data } = await axiosInstance.get<Order[]>('/orders', { params })
    return data
  },
  get: async (id: string) => {
    const { data } = await axiosInstance.get<Order>(`/orders/${id}`)
    return data
  },
  create: async (payload: {
    clientId?: string | null
    items: {
      productId: string
      lotId: string
      supplierId: string
      qty: number
      unitPrice: number
    }[]
    note?: string
  }) => {
    const { data } = await axiosInstance.post<Order>('/orders', payload)
    return data
  },
  stats: async (params?: { from?: string; to?: string }) => {
    const { data } = await axiosInstance.get<DashboardStats>('/orders/stats', { params })
    return data
  },
}

// ── Lots ─────────────────────────────────────────────────────────────────────
export const lotApi = {
  list: async () => {
    const { data } = await axiosInstance.get<Lot[]>('/lots')
    return data
  },
  create: async (payload: { name: string; code: string; isActive?: boolean }) => {
    const { data } = await axiosInstance.post<Lot>('/lots', payload)
    return data
  },
  update: async (id: string, payload: { name?: string; isActive?: boolean }) => {
    const { data } = await axiosInstance.put<Lot>(`/lots/${id}`, payload)
    return data
  },
  remove: async (id: string) => {
    const { data } = await axiosInstance.delete<{ message: string }>(`/lots/${id}`)
    return data
  },
}

export type ReceptionPayload = {
  supplier: string
  note?: string
  lines: Array<{
    product: string
    lot: string
    quantity: number
    status: 'A' | 'R'
    buyPrice: number
    sellPrice: number
    expiryDate?: string | null
    observation?: string
  }>
}

export const receptionApi = {
  list: async () => {
    const { data } = await axiosInstance.get<Reception[]>('/receptions')
    return data
  },
  get: async (id: string) => {
    const { data } = await axiosInstance.get<Reception>(`/receptions/${id}`)
    return data
  },
  create: async (payload: ReceptionPayload) => {
    const { data } = await axiosInstance.post<Reception>('/receptions', payload)
    return data
  },
  update: async (id: string, payload: ReceptionPayload) => {
    const { data } = await axiosInstance.put<Reception>(`/receptions/${id}`, payload)
    return data
  },
  remove: async (id: string) => {
    const { data } = await axiosInstance.delete<{ message: string }>(`/receptions/${id}`)
    return data
  },
}

// ── Stock ────────────────────────────────────────────────────────────────────
export const stockApi = {
  movements: async (params?: {
    product?: string
    type?: string
    from?: string
    to?: string
  }) => {
    const { data } = await axiosInstance.get<StockMovement[]>('/stock/movements', { params })
    return data
  },
  positions: async () => {
    const { data } = await axiosInstance.get<StockPosition[]>('/stock/positions')
    return data
  },
}

// ── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: async () => {
    const { data } = await axiosInstance.get<Settings>('/settings')
    return data
  },
  update: async (payload: Partial<Settings>) => {
    const { data } = await axiosInstance.put<Settings>('/settings', payload)
    return data
  },
}

export const shiftApi = {
  current: async () => {
    const { data } = await axiosInstance.get<ShiftSnapshot>('/shifts/current')
    return data
  },
  list: async () => {
    const { data } = await axiosInstance.get<Shift[]>('/shifts')
    return data
  },
  open: async (openingFloat: number) => {
    const { data } = await axiosInstance.post<ShiftSnapshot>('/shifts', { openingFloat })
    return data
  },
  close: async (id: string, payload: { countedCash: number; note?: string }) => {
    const { data } = await axiosInstance.post<Shift>(`/shifts/${id}/close`, payload)
    return data
  },
}

export const adjustmentApi = {
  list: async () => {
    const { data } = await axiosInstance.get<StockAdjustment[]>('/adjustments')
    return data
  },
  create: async (payload: {
    productId: string
    lotId: string
    supplierId: string
    reason: StockAdjustment['reason']
    quantity?: number
    countedQty?: number
    observation: string
  }) => {
    const { data } = await axiosInstance.post<StockAdjustment>('/adjustments', payload)
    return data
  },
}

export const expenseApi = {
  list: async (params?: { from?: string; to?: string }) => {
    const { data } = await axiosInstance.get<Expense[]>('/expenses', { params })
    return data
  },
  create: async (payload: {
    date: string
    name: string
    category: ExpenseCategory
    amount: number
    note?: string
  }) => {
    const { data } = await axiosInstance.post<Expense>('/expenses', payload)
    return data
  },
  update: async (
    id: string,
    payload: { date: string; name: string; category: ExpenseCategory; amount: number; note?: string }
  ) => {
    const { data } = await axiosInstance.put<Expense>(`/expenses/${id}`, payload)
    return data
  },
  remove: async (id: string) => {
    const { data } = await axiosInstance.delete<{ message: string }>(`/expenses/${id}`)
    return data
  },
}
