import type { Request, Response } from 'express'
import * as service from '../services/products.service'

export function listProducts(_req: Request, res: Response): void {
  const products = service.listProducts()
  res.json(products)
}
