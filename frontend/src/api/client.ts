import type { Product } from '../types'

// O Vite faz proxy de /api → http://localhost:3001 (ver vite.config.ts).
const API_BASE = '/api'

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`)
  if (!res.ok) {
    throw new Error('Falha ao buscar produtos.')
  }
  return res.json()
}
