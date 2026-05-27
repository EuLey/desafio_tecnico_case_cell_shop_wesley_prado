import * as productsRepo from '../repositories/products.repo'
import * as ordersRepo from '../repositories/orders.repo'
import * as idempotencyRepo from '../repositories/idempotency.repo'
import * as paymentService from './payment.service'
import { withLocks } from '../lib/mutex'
import type { CheckoutRequest } from '../schemas/checkout.schema'
import type { Order, OrderItem } from '../domain/types'
import { ProductNotFoundError, OutOfStockError } from '../domain/errors'

export async function processCheckout(input: CheckoutRequest): Promise<Order> {
  // Idempotência: mesma key → retorna a resposta original sem reprocessar.
  const cached = idempotencyRepo.get(input.idempotencyKey)
  if (cached) {
    return cached
  }

  const productIds = input.items.map((item) => item.productId)

  // Serializa por produto: dois requests pro mesmo productId não podem ler
  // o estoque ao mesmo tempo. Lock liberado automaticamente no fim do bloco.
  return withLocks(productIds, async () => {
    // Re-checa idempotência dentro do lock (cobre race de duas chamadas
    // simultâneas com a mesma key chegando antes da primeira terminar).
    const cachedInLock = idempotencyRepo.get(input.idempotencyKey)
    if (cachedInLock) {
      return cachedInLock
    }

    let total = 0
    const lineItems: OrderItem[] = input.items.map((item) => {
      const product = productsRepo.getProduct(item.productId)
      if (!product) {
        throw new ProductNotFoundError(item.productId)
      }
      if (product.stock < item.quantity) {
        throw new OutOfStockError(item.productId, product.stock)
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

    const order = ordersRepo.create({
      customerId: input.customerId,
      items: lineItems,
      total,
    })

    idempotencyRepo.set(input.idempotencyKey, order)
    return order
  })
}
