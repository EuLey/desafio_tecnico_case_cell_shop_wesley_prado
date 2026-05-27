import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import * as productsRepo from '../repositories/products.repo'
import { resetAll, validPayload } from './helpers/reset'

describe('POST /checkout - caminho feliz', () => {
  beforeEach(() => {
    resetAll()
  })

  it('retorna 201 com orderId e decrementa o estoque do produto', async () => {
    const app = createApp()
    const payload = validPayload()

    const res = await request(app).post('/checkout').send(payload)

    expect(res.status).toBe(201)
    expect(res.body.orderId).toBeDefined()
    expect(res.body.status).toBe('received')
    expect(res.body.total).toBe(89.9)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0]).toMatchObject({
      productId: 'cap-iphone-15',
      quantity: 1,
      unitPrice: 89.9,
    })
    expect(res.body.createdAt).toBeDefined()

    const product = productsRepo.getProduct('cap-iphone-15')
    expect(product?.stock).toBe(9)
  })
})
