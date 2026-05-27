import * as repo from '../repositories/orders.repo'
import { OrderNotFoundError } from '../domain/errors'
import type { Order } from '../domain/types'

export function getOrder(orderId: string): Order {
  const order = repo.getById(orderId)
  if (!order) {
    throw new OrderNotFoundError(orderId)
  }
  return order
}
