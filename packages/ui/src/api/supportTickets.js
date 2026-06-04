import client from '@/api/client'

const getMyTickets = () => client.get('/support-tickets')
const createTicket = (body) => client.post('/support-tickets', body)
const getAdminTickets = (params) => client.get('/support-tickets/admin', { params })
const updateTicket = (id, body) => client.patch(`/support-tickets/${id}`, body)
const replyToTicket = (id, body) => client.post(`/support-tickets/${id}/replies`, body)

export default {
    getMyTickets,
    createTicket,
    getAdminTickets,
    updateTicket,
    replyToTicket
}
