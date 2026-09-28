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
  supplier: Pick<Supplier, '_id' | 'fullName'> | null
}

export interface OrderItem {
  product: Pick<Product, '_id' | 'code' | 'name'> | string
  lot: Pick<Lot, '_id' | 'code' | 'name'> | string
  supplier: Pick<Supplier, '_id' | 'fullName'> | string
  qty: number
  catalogPrice: number
  unitPrice: number
  buyPrice?: number | null
  lineTotal: number
}

export interface Order {
  _id: string
  number: string
  client: Pick<Client, '_id' | 'fullName' | 'phone' | 'loyaltyPoints'> | null
  items: OrderItem[]
  subtotal: number
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
  supplier: Pick<Supplier, '_id' | 'fullName'> | null
  lot: Pick<Lot, '_id' | 'code' | 'name'> | null
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
  caToday: number
  ticketsToday: number
  caPeriod: number
  margePeriod: number
  resultatPeriod: number
  days: { date: string; ca: number; marge: number }[]
  topProducts: { name: string; qty: number; marge: number }[]
  fraisByCategory: { category: string; amount: number }[]
  lowPiles: {
    productCode: string
    productName: string
    lotCode: string
    supplierName: string
    quantity: number
  }[]
}

export interface Shift {
  _id: string
  status: 'open' | 'closed'
  openingFloat: number
  openedBy: { name: string } | null
  openedAt: string
  closedBy: { name: string } | null
  closedAt: string | null
  countedCash: number | null
  expectedCash: number | null
  ecart: number | null
  note: string
}

export interface ShiftSnapshot {
  shift: Shift | null
  ticketCount: number
  ticketTotal: number
  expectedCash: number
}

export type AdjustmentReason = 'casse' | 'perte' | 'inventaire'

export interface StockAdjustment {
  _id: string
  product: Pick<Product, '_id' | 'code' | 'name'> | null
  lot: Pick<Lot, '_id' | 'code' | 'name'> | null
  supplier: Pick<Supplier, '_id' | 'fullName'> | null
  reason: AdjustmentReason
  quantity: number
  direction: 'in' | 'out'
  observation: string
  createdBy: { name: string } | null
  createdAt: string
}

export type ExpenseCategory = 'loyer' | 'electricite' | 'eau' | 'salaires' | 'autre'

export interface Expense {
  _id: string
  date: string
  name: string
  category: ExpenseCategory
  amount: number
  note: string
  createdBy: { name: string } | null
}
