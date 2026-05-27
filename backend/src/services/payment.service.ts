import { PaymentDeclinedError } from '../domain/errors'

// Simulação determinística do gateway de pagamento.
// Qualquer token contendo "declined" é recusado; demais são aprovados.
// Permite reproduzir o cenário 422 sem integração real.
export async function charge(token: string): Promise<void> {
  if (token.includes('declined')) {
    throw new PaymentDeclinedError('insufficient_funds')
  }
}
