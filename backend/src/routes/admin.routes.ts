import { Router } from 'express'
import * as controller from '../controllers/admin.controller'

export const adminRouter = Router()

adminRouter.post('/reset', controller.resetAll)
