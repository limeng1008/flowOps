import express from 'express'
import paymentController from '../../controllers/payment'

const router = express.Router()

router.post('/order', paymentController.createOrder)
router.get('/order/:orderNo', paymentController.getOrderStatus)
router.post('/notify/alipay', paymentController.alipayNotify)
router.post('/notify/wechat', paymentController.wechatNotify)

export default router
