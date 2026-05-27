import type { Request, Response, NextFunction } from 'express'
import * as service from '../services/orders.service'

export function getOrder(req: Request, res: Response, next: NextFunction): void {
  try {
    const order = service.getOrder(req.params.id)
    res.json(order)
  } catch (err) {
    next(err)
  }
}
