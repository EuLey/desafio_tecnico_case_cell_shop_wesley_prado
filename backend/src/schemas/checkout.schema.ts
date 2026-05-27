import { z } from 'zod'

export const checkoutSchema = z.object({
  idempotencyKey: z.string().min(1, 'idempotencyKey é obrigatório'),
  customerId: z.string().min(1, 'customerId é obrigatório'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'productId é obrigatório'),
        quantity: z.number().int().positive('quantity deve ser maior que zero'),
      }),
    )
    .min(1, 'items deve conter pelo menos um item'),
  shippingAddress: z
    .object({
      cep: z.string().min(1, 'cep é obrigatório'),
    })
    .passthrough(),
  paymentMethod: z.object({
    type: z.string().min(1, 'type é obrigatório'),
    token: z.string().min(1, 'token é obrigatório'),
  }),
})

export type CheckoutRequest = z.infer<typeof checkoutSchema>
