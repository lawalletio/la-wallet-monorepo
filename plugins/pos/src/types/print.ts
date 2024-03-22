import { OrderItem } from './order'

export interface PrintOrder {
  items: OrderItem[]
  total: number
  totalSats: number
  currency: string
}
