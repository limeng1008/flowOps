const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const requiredKeys = [
    'pages.credentials.title',
    'pages.credentials.description',
    'pages.credentials.searchPlaceholder',
    'pages.credentials.addButton',
    'pages.credentials.addNewTitle',
    'pages.credentials.colName',
    'pages.credentials.colLastUpdated',
    'pages.credentials.colCreated',
    'common.noCredentialsYet',
    'common.credentialDeleted'
]

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)

describe('credentials i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('localizes credentials table dates by current language', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/credentials/index.jsx'), 'utf8')

        expect(source).toContain('dateFormat')
        expect(source).toContain("i18n.language?.startsWith('zh')")
        expect(source).toContain('format(dateFormat)')
        expect(source).not.toContain("format('MMMM Do, YYYY HH:mm:ss')")
    })
})
