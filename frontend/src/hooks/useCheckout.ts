import { useCallback, useState } from 'react'
import type { Order } from '../types'

// State machine do checkout. Mantém qual productId está sendo processado
// para que o card específico mostre o spinner.
type CheckoutState =
  | { status: 'idle' }
  | { status: 'loading'; productId: string }
  | { status: 'success'; order: Order }
  | { status: 'error'; message: string }

type CheckoutOptions = {
  // Quando true, envia um token que o backend simula como recusado (422).
  simulatePaymentFailure?: boolean
}

const FIXED_PAYLOAD = {
  customerId: 'customer-demo',
  shippingAddress: { cep: '01310-100' },
}

export function useCheckout() {
  const [state, setState] = useState<CheckoutState>({ status: 'idle' })

  const checkout = useCallback(
    async (productId: string, options: CheckoutOptions = {}, quantity = 1) => {
      setState({ status: 'loading', productId })

      const token = options.simulatePaymentFailure
        ? 'tok_visa_declined'
        : 'tok_visa_approved'

      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...FIXED_PAYLOAD,
            idempotencyKey: crypto.randomUUID(),
            items: [{ productId, quantity }],
            paymentMethod: { type: 'credit_card', token },
          }),
        })

        const body = await res.json()

        if (!res.ok) {
          const message: string = body?.error?.message ?? `Erro ${res.status} ao processar a compra.`
          setState({ status: 'error', message })
          return
        }

        setState({ status: 'success', order: body as Order })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro inesperado ao processar a compra.'
        setState({ status: 'error', message })
      }
    },
    [],
  )

  const reset = useCallback(() => setState({ status: 'idle' }), [])

  return { state, checkout, reset }
}
