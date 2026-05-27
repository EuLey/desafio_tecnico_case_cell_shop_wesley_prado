import { randomUUID } from 'crypto'
import type { Order, OrderItem } from '../domain/types'

const orders = new Map<string, Order>()

type CreateOrderInput = {
  customerId: string
  items: OrderItem[]
  total: number
}

export function create(input: CreateOrderInput): Order {
  const order: Order = {
    orderId: randomUUID(),
    status: 'received',
    customerId: input.customerId,
    items: input.items,
    total: input.total,
    createdAt: new Date().toISOString(),
  }
  orders.set(order.orderId, order)
  return order
}

export function getById(orderId: string): Order | undefined {
  return orders.get(orderId)
}
