import { Router } from 'express'
import * as controller from '../controllers/products.controller'

export const productsRouter = Router()

productsRouter.get('/', controller.listProducts)
