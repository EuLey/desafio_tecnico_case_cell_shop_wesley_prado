import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import * as productsRepo from '../repositories/products.repo'
import { resetAll, validPayload } from './helpers/reset'

describe('POST /checkout - concorrência no último item', () => {
  beforeEach(() => {
    resetAll()
  })

  it('duas requisições simultâneas pro mesmo produto com estoque=1: uma ganha 201, outra recebe 409', async () => {
    const app = createApp()

    // cap-galaxy-s24 tem estoque inicial = 1 no seed.
    const payloadA = validPayload({
      idempotencyKey: 'race-A',
      items: [{ productId: 'cap-galaxy-s24', quantity: 1 }],
    })
    const payloadB = validPayload({
      idempotencyKey: 'race-B',
      items: [{ productId: 'cap-galaxy-s24', quantity: 1 }],
    })

    const [resA, resB] = await Promise.all([
      request(app).post('/checkout').send(payloadA),
      request(app).post('/checkout').send(payloadB),
    ])

    const statuses = [resA.status, resB.status].sort()
    expect(statuses).toEqual([201, 409])

    // Estoque final precisa ser exatamente 0 (decrementado uma única vez).
    const product = productsRepo.getProduct('cap-galaxy-s24')
    expect(product?.stock).toBe(0)
  })
})
