import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import { resetAll, validPayload } from './helpers/reset'

describe('POST /checkout - produto inexistente', () => {
  beforeEach(() => {
    resetAll()
  })

  it('retorna 404 quando productId não existe', async () => {
    const app = createApp()
    const payload = validPayload({
      items: [{ productId: 'produto-que-nao-existe', quantity: 1 }],
    })

    const res = await request(app).post('/checkout').send(payload)

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND')
    expect(res.body.error.details).toMatchObject({
      productId: 'produto-que-nao-existe',
    })
  })
})
