import { Router } from 'express'
import * as controller from '../controllers/checkout.controller'
import { validate } from '../middlewares/validate'
import { checkoutSchema } from '../schemas/checkout.schema'

export const checkoutRouter = Router()

checkoutRouter.post('/', validate(checkoutSchema), controller.postCheckout)
