import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import * as productsRepo from '../repositories/products.repo'
import { resetAll, validPayload } from './helpers/reset'

describe('POST /checkout - estoque insuficiente', () => {
  beforeEach(() => {
    resetAll()
  })

  it('retorna 409 quando quantidade pedida é maior que o estoque, sem decrementar', async () => {
    const app = createApp()
    const payload = validPayload({
      items: [{ productId: 'cap-iphone-15', quantity: 999 }], // estoque inicial é 10
    })

    const res = await request(app).post('/checkout').send(payload)

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('OUT_OF_STOCK')
    expect(res.body.error.details).toMatchObject({
      productId: 'cap-iphone-15',
      availableQty: 10,
    })

    // Estoque NÃO pode ter sido tocado.
    const product = productsRepo.getProduct('cap-iphone-15')
    expect(product?.stock).toBe(10)
  })
})
