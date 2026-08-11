export interface AuthUser {
  id: string
  name: string
  role: 'admin' | 'cashier'
}

export interface Client {
  _id: string
  fullName: string
  phone: string
  loyaltyPoints: number
  totalSpent: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  _id: string
  name: { fr: string; en: string }
  createdAt: string
}

export interface Supplier {
  _id: string
  name: string
  phone: string
  email: string
  address: string
  createdAt: string
}

export interface Product {
  _id: string
  name: string
  qrCode: string
  buyPrice: number
  sellPrice: number
  quantity: number
  lowStockThreshold: number
  isLowStock: boolean
  category: Category | null
  supplier: Supplier | null
  createdAt: string
}

export interface OrderItem {
  product: Product | string
  qty: number
  unitPrice: number
  discount: number
  lineTotal: number
}

export interface Order {
  _id: string
  client: Client | null
  items: OrderItem[]
  subtotal: number
  discountTotal: number
  total: number
  createdBy: { name: string } | null
  note: string
  createdAt: string
}

export interface StockMovement {
  _id: string
  product: Product
  type: 'in' | 'out'
  quantity: number
  source: 'order' | 'supplier-delivery' | 'manual'
  referenceId: string | null
  note: string
  date: string
}

export interface Settings {
  _id: string
  loyaltyThreshold: number
  loyaltyReward: number
  currency: string
  shopName: string
}

export interface DashboardStats {
  revenue30d: number
  orders30d: number
  totalClients: number
  lowStockCount: number
  dailyRevenue: { date: string; revenue: number }[]
  topProducts: { name: string; qty: number }[]
}
