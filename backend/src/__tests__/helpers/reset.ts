import * as productsRepo from '../../repositories/products.repo'
import * as ordersRepo from '../../repositories/orders.repo'
import * as idempotencyRepo from '../../repositories/idempotency.repo'

export function resetAll(): void {
  productsRepo.__resetForTesting()
  ordersRepo.__resetForTesting()
  idempotencyRepo.__resetForTesting()
}

export function validPayload(overrides: Partial<{
  idempotencyKey: string
  customerId: string
  items: Array<{ productId: string; quantity: number }>
  shippingAddress: { cep: string }
  paymentMethod: { type: string; token: string }
}> = {}) {
  return {
    idempotencyKey: 'idem-default',
    customerId: 'cliente-001',
    items: [{ productId: 'cap-iphone-15', quantity: 1 }],
    shippingAddress: { cep: '01310-100' },
    paymentMethod: { type: 'credit_card', token: 'tok_visa_approved' },
    ...overrides,
  }
}
