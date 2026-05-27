import type { Product } from '../domain/types'

// Seed em memória: 3 produtos com estoques distintos para cobrir os cenários
// de teste (caminho feliz, concorrência no último item e produto esgotado).
const SEED: Product[] = [
  {
    id: 'cap-iphone-15',
    name: 'Capa iPhone 15 - Silicone Preta',
    price: 89.9,
    stock: 10,
    imageUrl: '/produtos/capa_iphone_15.jpg',
  },
  {
    id: 'cap-galaxy-s24',
    name: 'Capa Galaxy S24 - Transparente',
    price: 59.9,
    stock: 1,
    imageUrl: '/produtos/capa_s24.jpg',
  },
  {
    id: 'cap-pixel-9',
    name: 'Capa Pixel 9 - Couro Caramelo',
    price: 129.9,
    stock: 0,
    imageUrl: '/produtos/capa_pixel_9.jpg',
  },
]

const products = new Map<string, Product>()

function loadSeed(): void {
  products.clear()
  for (const p of SEED) {
    products.set(p.id, { ...p })
  }
}

loadSeed()

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

// Apenas para uso em testes — restaura o estoque inicial do seed.
export function __resetForTesting(): void {
  loadSeed()
}
