import type { Product } from '../domain/types'

// Seed em memória: 3 produtos com estoques distintos para cobrir os cenários
// de teste (caminho feliz, concorrência no último item e produto esgotado).
const products = new Map<string, Product>([
  ['cap-iphone-15', { id: 'cap-iphone-15', name: 'Capa iPhone 15 - Silicone Preta', price: 89.9, stock: 10 }],
  ['cap-galaxy-s24', { id: 'cap-galaxy-s24', name: 'Capa Galaxy S24 - Transparente', price: 59.9, stock: 1 }],
  ['cap-pixel-9', { id: 'cap-pixel-9', name: 'Capa Pixel 9 - Couro Caramelo', price: 129.9, stock: 0 }],
])

export function listProducts(): Product[] {
  return Array.from(products.values())
}

export function getProduct(id: string): Product | undefined {
  return products.get(id)
}

export function decrementStock(id: string, quantity: number): void {
  const product = products.get(id)
  if (!product) return
  product.stock -= quantity
}
