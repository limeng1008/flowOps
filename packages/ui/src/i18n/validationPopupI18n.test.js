const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const source = fs.readFileSync(path.join(__dirname, '../views/chatmessage/ValidationPopUp.jsx'), 'utf8')

describe('ValidationPopUp i18n', () => {
    it('localizes the validate flow button and loading label', () => {
        expect(en.components.validation.validateFlow).toBeTruthy()
        expect(en.components.validation.validating).toBeTruthy()
        expect(zh.components.validation.validateFlow).toBeTruthy()
        expect(zh.components.validation.validating).toBeTruthy()

        expect(source).toContain("t('components.validation.validateFlow')")
        expect(source).toContain("t('components.validation.validating')")
        expect(source).not.toContain('Validate Flow')
        expect(source).not.toContain('Validating...')
    })
})
