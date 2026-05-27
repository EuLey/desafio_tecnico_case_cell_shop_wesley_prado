export type Product = {
  id: string
  name: string
  price: number
  stock: number
  imageUrl: string
}

export type OrderItem = {
  productId: string
  quantity: number
  unitPrice: number
}

export type Order = {
  orderId: string
  status: 'received'
  customerId: string
  items: OrderItem[]
  total: number
  createdAt: string
}
