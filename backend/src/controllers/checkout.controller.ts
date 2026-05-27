import type { Request, Response, NextFunction } from 'express'
import * as service from '../services/checkout.service'

export async function postCheckout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const order = await service.processCheckout(req.body)
    res.status(201).json(order)
  } catch (err) {
    next(err)
  }
}
