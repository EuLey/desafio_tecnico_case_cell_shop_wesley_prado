import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import { resetAll, validPayload } from './helpers/reset'

describe('POST /checkout - validação de entrada', () => {
  beforeEach(() => {
    resetAll()
  })

  it('retorna 400 quando customerId está faltando, apontando o campo', async () => {
    const app = createApp()
    const { customerId: _omit, ...payload } = validPayload()
    void _omit

    const res = await request(app).post('/checkout').send(payload)

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'customerId' }),
      ]),
    )
  })

  it('retorna 400 quando quantity é zero, apontando o campo aninhado', async () => {
    const app = createApp()
    const payload = validPayload({
      items: [{ productId: 'cap-iphone-15', quantity: 0 }],
    })

    const res = await request(app).post('/checkout').send(payload)

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'items.0.quantity' }),
      ]),
    )
  })
})
