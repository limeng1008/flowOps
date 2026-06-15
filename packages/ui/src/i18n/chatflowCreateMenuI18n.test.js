const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const requiredKeys = [
    'pages.chatflows.create.blankChatflow',
    'pages.chatflows.create.blankChatflowDescription',
    'pages.chatflows.create.feishuHandoff',
    'pages.chatflows.create.feishuHandoffDescription'
]

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)

describe('chatflow create menu i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('routes the Feishu handoff create action through the chatflows page', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/chatflows/index.jsx'), 'utf8')

        expect(source).toContain('createFeishuHandoffTemplateFlowData')
        expect(source).toContain("t('pages.chatflows.create.feishuHandoff')")
        expect(source).toContain("t('pages.chatflows.create.blankChatflow')")
    })
})
