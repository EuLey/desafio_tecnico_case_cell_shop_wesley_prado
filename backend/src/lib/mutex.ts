// Mutex assíncrono por chave. Serializa operações sobre a mesma chave (productId)
// para evitar race condition no decremento de estoque quando duas requisições
// concorrentes tentam comprar o mesmo produto (cenário 6 dos testes).
//
// Em produção com múltiplas instâncias do back, viraria um lock distribuído
// (SETNX no Redis). Em memória resolve dentro do mesmo processo Node — limitação
// registrada no README.

const locks = new Map<string, Promise<unknown>>()

async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve()
  const current = previous.then(
    () => fn(),
    () => fn(),
  )
  locks.set(key, current.catch(() => undefined))
  return current
}

// Adquire vários locks em ordem alfabética da chave (previne deadlock quando
// requisições concorrentes pedem produtos sobrepostos em ordens diferentes).
export async function withLocks<T>(keys: string[], fn: () => Promise<T>): Promise<T> {
  const sorted = [...new Set(keys)].sort()

  async function acquire(remaining: string[]): Promise<T> {
    const [head, ...tail] = remaining
    if (!head) return fn()
    return withLock(head, () => acquire(tail))
  }

  return acquire(sorted)
}
