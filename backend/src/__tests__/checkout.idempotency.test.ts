import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import * as productsRepo from '../repositories/products.repo'
import { resetAll, validPayload } from './helpers/reset'

describe('POST /checkout - idempotência', () => {
  beforeEach(() => {
    resetAll()
  })

  it('retorna o mesmo orderId quando a mesma idempotencyKey é enviada 2x, sem duplicar', async () => {
    const app = createApp()
    const payload = validPayload({ idempotencyKey: 'idem-001' })

    const first = await request(app).post('/checkout').send(payload)
    expect(first.status).toBe(201)

    const second = await request(app).post('/checkout').send(payload)
    expect(second.status).toBe(201)

    expect(second.body.orderId).toBe(first.body.orderId)
    expect(second.body.createdAt).toBe(first.body.createdAt)

    // Estoque foi decrementado apenas UMA vez (10 → 9).
    const product = productsRepo.getProduct('cap-iphone-15')
    expect(product?.stock).toBe(9)
  })
})
