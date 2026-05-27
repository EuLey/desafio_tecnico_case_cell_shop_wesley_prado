import type { Request, Response } from 'express'
import * as productsRepo from '../repositories/products.repo'
import * as ordersRepo from '../repositories/orders.repo'
import * as idempotencyRepo from '../repositories/idempotency.repo'

// Endpoint DEV-ONLY: zera o estado em memória (produtos, pedidos, idempotência)
// e devolve aos valores do seed. Reusa o helper `__resetForTesting` que já existia
// para os testes automatizados.
//
// Em um sistema real isso estaria atrás de auth de admin ou de um guard por
// NODE_ENV !== 'production'. Para o escopo do desafio fica explícito como dev tool
// (documentado no README) — facilita a vida do avaliador testando manualmente.
export function resetAll(_req: Request, res: Response): void {
  productsRepo.__resetForTesting()
  ordersRepo.__resetForTesting()
  idempotencyRepo.__resetForTesting()
  res.status(200).json({
    ok: true,
    message: 'Estoque, pedidos e cache de idempotência foram resetados.',
  })
}
