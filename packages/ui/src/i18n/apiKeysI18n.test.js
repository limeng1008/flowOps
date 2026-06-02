const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const apiKeyPageKeys = [
    'pages.apikey.createKey',
    'pages.apikey.editTitle',
    'pages.apikey.keyName',
    'pages.apikey.keyNamePlaceholder',
    'pages.apikey.apiKey',
    'pages.apikey.permissions',
    'pages.apikey.usage',
    'pages.apikey.updated',
    'pages.apikey.copied',
    'pages.apikey.copy',
    'pages.apikey.copyApiKey',
    'pages.apikey.show',
    'pages.apikey.hide',
    'pages.apikey.chatflowName',
    'pages.apikey.modifiedOn',
    'pages.apikey.category',
    'pages.apikey.selectAll',
    'pages.apikey.deleteTitle',
    'pages.apikey.deleteConfirm',
    'pages.apikey.deleteConfirmWithUsage'
]

const permissionKeys = [
    'permissions.categories.chatflows',
    'permissions.categories.agentflows',
    'permissions.categories.tools',
    'permissions.categories.assistants',
    'permissions.categories.credentials',
    'permissions.categories.variables',
    'permissions.categories.apikeys',
    'permissions.categories.documentStores',
    'permissions.categories.executions',
    'permissions.categories.templates',
    'permissions.actions.view',
    'permissions.actions.create',
    'permissions.actions.update',
    'permissions.actions.duplicate',
    'permissions.actions.delete',
    'permissions.actions.export',
    'permissions.actions.import',
    'permissions.full.documentStores.delete',
    'permissions.full.documentStores.add_loader',
    'permissions.full.documentStores.delete_loader',
    'permissions.full.documentStores.preview_process',
    'permissions.full.templates.marketplace',
    'permissions.full.templates.custom'
]

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)

describe('API key i18n coverage', () => {
    it.each([...apiKeyPageKeys, ...permissionKeys])('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('translates the API key page actions, dialog props, delete confirmation, and table headers', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/apikey/index.jsx'), 'utf8')

        expect(source).toContain("t('pages.apikey.createKey')")
        expect(source).toContain("title: t('pages.apikey.editTitle')")
        expect(source).toContain("confirmButtonName: t('common.save')")
        expect(source).toContain("title: t('pages.apikey.deleteTitle')")
        expect(source).toContain("t('pages.apikey.deleteConfirm'")
        expect(source).toContain("t('pages.apikey.deleteConfirmWithUsage'")
        expect(source).toContain("t('pages.apikey.keyName')")
        expect(source).toContain("t('pages.apikey.apiKey')")
        expect(source).toContain("t('pages.apikey.permissions')")
        expect(source).toContain("t('pages.apikey.usage')")
        expect(source).toContain("t('pages.apikey.updated')")
        expect(source).not.toContain('>Create Key<')
        expect(source).not.toContain('>Key Name<')
        expect(source).not.toContain('>Permissions<')
    })

    it('translates API key row actions, copied hint, nested table, dates, and stored permission keys', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/apikey/index.jsx'), 'utf8')

        expect(source).toContain("title={t('pages.apikey.copy')}")
        expect(source).toContain(
            "title={props.showApiKeys.includes(props.apiKey.apiKey) ? t('pages.apikey.hide') : t('pages.apikey.show')}"
        )
        expect(source).toContain("title={t('common.edit')}")
        expect(source).toContain("title={t('common.delete')}")
        expect(source).toContain("t('pages.apikey.copied')")
        expect(source).toContain("t('pages.apikey.chatflowName')")
        expect(source).toContain("t('pages.apikey.modifiedOn')")
        expect(source).toContain("t('pages.apikey.category')")
        expect(source).toContain('translatePermissionLabel')
        expect(source).toContain('dateFormat')
        expect(source).not.toContain('Copied!')
        expect(source).not.toContain('Chatflow Name')
        expect(source).not.toContain('Modified On')
    })

    it('translates the API key create/edit dialog labels, actions, and permission list', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/apikey/APIKeyDialog.jsx'), 'utf8')

        expect(source).toContain("t('pages.apikey.apiKey')")
        expect(source).toContain("title={t('pages.apikey.copyApiKey')}")
        expect(source).toContain("t('pages.apikey.copied')")
        expect(source).toContain("t('pages.apikey.keyName')")
        expect(source).toContain("placeholder={t('pages.apikey.keyNamePlaceholder')}")
        expect(source).toContain("t('pages.apikey.permissions')")
        expect(source).toContain("t('pages.apikey.selectAll')")
        expect(source).toContain('translatePermissionCategory')
        expect(source).toContain('translatePermissionLabel')
        expect(source).toContain("dialogProps.cancelButtonName || t('common.cancel')")
        expect(source).not.toContain('>Cancel<')
        expect(source).not.toContain('>Select All<')
        expect(source).not.toContain('placeholder="My New Key"')
    })
})
