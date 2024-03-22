export interface ProductData {
  id: number
  category_id: number
  name: string
  description: string
  price: {
    value: number
    currency: string
  }
}

export interface ProductQtyData extends ProductData {
  qty: number
}
