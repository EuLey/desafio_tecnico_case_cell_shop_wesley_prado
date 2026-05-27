import type { Order } from '../domain/types'

// Cache em memória de respostas por idempotencyKey.
// Em produção, viraria Redis com TTL (ex.: 24h) — registrado como dívida no README.
const cache = new Map<string, Order>()

export function get(key: string): Order | undefined {
  return cache.get(key)
}

export function set(key: string, order: Order): void {
  cache.set(key, order)
}

// Apenas para uso em testes — limpa o cache de idempotência.
export function __resetForTesting(): void {
  cache.clear()
}
