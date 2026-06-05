import express from 'express'
import supportTicketsController from '../../controllers/support-tickets'

const router = express.Router()

router.get('/', supportTicketsController.listMyTickets)
router.post('/', supportTicketsController.createTicket)
router.get('/admin', supportTicketsController.listAdminTickets)
router.get('/:id', supportTicketsController.getTicket)
router.patch('/:id', supportTicketsController.updateTicket)
router.post('/:id/replies', supportTicketsController.replyToTicket)

export default router
