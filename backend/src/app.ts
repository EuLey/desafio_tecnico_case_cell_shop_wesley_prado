import express, { type Express, type Request, type Response } from 'express'
import { productsRouter } from './routes/products.routes'
import { checkoutRouter } from './routes/checkout.routes'
import { ordersRouter } from './routes/orders.routes'
import { adminRouter } from './routes/admin.routes'
import { errorHandler } from './middlewares/errorHandler'

export function createApp(): Express {
  const app = express()

  app.use(express.json())

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true })
  })

  app.use('/products', productsRouter)
  app.use('/checkout', checkoutRouter)
  app.use('/orders', ordersRouter)
  app.use('/admin', adminRouter)

  // errorHandler precisa ser o ÚLTIMO middleware.
  app.use(errorHandler)

  return app
}
