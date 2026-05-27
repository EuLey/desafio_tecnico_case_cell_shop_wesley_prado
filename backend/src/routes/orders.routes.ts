import { Router } from 'express'
import * as controller from '../controllers/orders.controller'

export const ordersRouter = Router()

ordersRouter.get('/:id', controller.getOrder)
