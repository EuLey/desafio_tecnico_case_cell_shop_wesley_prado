import * as repo from '../repositories/products.repo'
import type { Product } from '../domain/types'

export function listProducts(): Product[] {
  return repo.listProducts()
}

export function getProduct(id: string): Product | undefined {
  return repo.getProduct(id)
}
