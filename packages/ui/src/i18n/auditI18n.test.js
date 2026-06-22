const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const requiredKeys = [
    'menu.audit',
    'pages.audit.title',
    'pages.audit.exportCsv',
    'pages.audit.filters.actorUserId',
    'pages.audit.filters.action',
    'pages.audit.filters.targetType',
    'pages.audit.filters.workspaceId',
    'pages.audit.filters.dateFrom',
    'pages.audit.filters.dateTo',
    'pages.audit.filters.apply',
    'pages.audit.filters.clear',
    'pages.audit.columns.time',
    'pages.audit.columns.actor',
    'pages.audit.columns.action',
    'pages.audit.columns.target',
    'pages.audit.columns.status',
    'pages.audit.columns.details',
    'pages.audit.details.before',
    'pages.audit.details.after',
    'pages.audit.details.metadata',
    'pages.audit.details.ip',
    'pages.audit.details.userAgent',
    'pages.audit.noResults',
    'pages.audit.status.success',
    'pages.audit.status.failure',
    'pages.audit.actionGroups.authentication',
    'pages.audit.actionGroups.roles',
    'pages.audit.actionGroups.workspaces',
    'pages.audit.actionGroups.workspaceUsers',
    'pages.audit.actionGroups.organizationUsers'
]

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)

describe('audit page i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })
})
