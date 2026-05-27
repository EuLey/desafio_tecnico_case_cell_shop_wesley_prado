import * as productsRepo from '../repositories/products.repo'
import * as ordersRepo from '../repositories/orders.repo'
import * as paymentService from './payment.service'
import type { CheckoutRequest } from '../schemas/checkout.schema'
import type { Order, OrderItem } from '../domain/types'

export async function processCheckout(input: CheckoutRequest): Promise<Order> {
  let total = 0
  const lineItems: OrderItem[] = input.items.map((item) => {
    const product = productsRepo.getProduct(item.productId)
    if (!product) {
      throw new Error(`Produto "${item.productId}" não encontrado`)
    }
    if (product.stock < item.quantity) {
      throw new Error(`Estoque insuficiente para "${item.productId}"`)
    }
    total += product.price * item.quantity
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
    }
  })

  await paymentService.charge(input.paymentMethod.token)

  for (const item of input.items) {
    productsRepo.decrementStock(item.productId, item.quantity)
  }

  return ordersRepo.create({
    customerId: input.customerId,
    items: lineItems,
    total,
  })
}
