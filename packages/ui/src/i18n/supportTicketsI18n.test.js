const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const requiredKeys = [
    'menu.support-tickets',
    'pages.supportTickets.title',
    'pages.supportTickets.myTickets',
    'pages.supportTickets.adminQueue',
    'pages.supportTickets.newTicket',
    'pages.supportTickets.subject',
    'pages.supportTickets.description',
    'pages.supportTickets.priority',
    'pages.supportTickets.category',
    'pages.supportTickets.status',
    'pages.supportTickets.requester',
    'pages.supportTickets.assignee',
    'pages.supportTickets.updatedAt',
    'pages.supportTickets.reply',
    'pages.supportTickets.replyPlaceholder',
    'pages.supportTickets.noTickets',
    'pages.supportTickets.open',
    'pages.supportTickets.pending',
    'pages.supportTickets.resolved',
    'pages.supportTickets.closed',
    'pages.supportTickets.low',
    'pages.supportTickets.normal',
    'pages.supportTickets.high',
    'pages.supportTickets.urgent'
]

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)

describe('support tickets i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })
})
