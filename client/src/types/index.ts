export interface AuthUser {
  id: string
  name: string
  role: 'admin' | 'cashier'
}

export interface Client {
  _id: string
  fullName: string
  phone: string | null
  loyaltyPoints: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  _id: string
  name: string
  code: string
  nextProductSeq: number
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  _id: string
  fullName: string
  phone: string
  location: string
  nif: string
  nis: string
  rc: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  _id: string
  code: string
  name: string
  qrCode: string
  category: Category | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Lot {
  _id: string
  code: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ReceptionLineStatus = 'A' | 'R'

export interface ReceptionLine {
  _id?: string
  product: Product | string
  lot: Lot | string
  quantity: number
  status: ReceptionLineStatus
  buyPrice: number
  sellPrice: number
  expiryDate: string | null
  observation: string
}

export interface Reception {
  _id: string
  number: string
  supplier: Supplier | string
  note: string
  lines: ReceptionLine[]
  createdAt: string
  updatedAt: string
}

export interface StockPosition {
  product: Pick<Product, '_id' | 'code' | 'name'> | null
  lot: Pick<Lot, '_id' | 'code' | 'name'> | null
  quantity: number
  lastBuyPrice: number
  lastSellPrice: number
  nearestExpiry: string | null
  lastReceptionAt: string
  lastReceptionNumber: string
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
  source: 'order' | 'supplier-delivery' | 'manual' | 'reception'
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
