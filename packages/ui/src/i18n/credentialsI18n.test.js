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
    'pages.credentials.shareCredential',
    'pages.credentials.confirmDeleteTitle',
    'pages.credentials.confirmDeleteDescription',
    'pages.credentials.failedDelete',
    'pages.credentials.expandSave',
    'pages.credentials.sharedCredential',
    'pages.credentials.oauthRedirectUrl',
    'pages.credentials.credentialName',
    'pages.credentials.authenticate',
    'pages.credentials.cannotEditSharedCredential',
    'pages.credentials.failedAdd',
    'pages.credentials.failedSave',
    'pages.credentials.failedOAuthSave',
    'pages.credentials.failedOpenAuthorizationWindow',
    'pages.credentials.oauth2AuthorizationFailed',
    'pages.credentials.invalidAuthorizationResponse',
    'pages.credentials.unknownError',
    'common.chooseOption',
    'common.noCredentialsYet',
    'common.credentialDeleted',
    'common.add',
    'common.cancel',
    'common.delete',
    'common.save'
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

    it('localizes credential dialog props and snackbar messages outside JSX text nodes', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/credentials/index.jsx'), 'utf8')
        const inputHandlerSource = fs.readFileSync(path.join(__dirname, '../views/credentials/CredentialInputHandler.jsx'), 'utf8')
        const addEditSource = fs.readFileSync(path.join(__dirname, '../views/credentials/AddEditCredentialDialog.jsx'), 'utf8')

        expect(source).toContain("cancelButtonName: t('common.cancel')")
        expect(source).toContain("confirmButtonName: t('common.add')")
        expect(source).toContain("confirmButtonName: t('common.save')")
        expect(source).toContain("confirmButtonName: t('permissions.actions.share')")
        expect(source).toContain("title: t('pages.credentials.shareCredential')")
        expect(source).toContain("title: t('pages.credentials.confirmDeleteTitle')")
        expect(source).toContain("description: t('pages.credentials.confirmDeleteDescription'")
        expect(source).toContain("confirmButtonName: t('common.delete')")
        expect(source).toContain("message: t('pages.credentials.failedDelete'")

        expect(inputHandlerSource).toContain("confirmButtonName: t('pages.credentials.expandSave')")
        expect(inputHandlerSource).toContain("cancelButtonName: t('common.cancel')")
        expect(inputHandlerSource).toContain("t('common.chooseOption')")

        expect(addEditSource).toContain("t('pages.credentials.failedAdd'")
        expect(addEditSource).toContain("t('pages.credentials.failedSave'")
        expect(addEditSource).toContain("t('pages.credentials.failedOAuthSave')")
        expect(addEditSource).toContain("t('pages.credentials.failedOpenAuthorizationWindow')")
        expect(addEditSource).toContain("t('pages.credentials.oauth2AuthorizationFailed'")
        expect(addEditSource).toContain("t('pages.credentials.invalidAuthorizationResponse')")
        expect(addEditSource).toContain("t('pages.credentials.unknownError')")
        expect(addEditSource).toContain("t('pages.credentials.cannotEditSharedCredential')")
        expect(addEditSource).toContain("t('pages.credentials.credentialName')")
        expect(addEditSource).toContain("t('pages.credentials.authenticate')")

        expect(source).not.toContain("cancelButtonName: 'Cancel'")
        expect(source).not.toContain("confirmButtonName: 'Add'")
        expect(source).not.toContain("confirmButtonName: 'Save'")
        expect(source).not.toContain("confirmButtonName: 'Share'")
        expect(source).not.toContain("title: 'Share Credential'")
        expect(source).not.toContain('`Delete credential ${credential.name}?`')
        expect(source).not.toContain('`Failed to delete Credential:')

        expect(inputHandlerSource).not.toContain("confirmButtonName: 'Save'")
        expect(inputHandlerSource).not.toContain("cancelButtonName: 'Cancel'")
        expect(inputHandlerSource).not.toContain("'choose an option'")

        expect(addEditSource).not.toContain('Failed to add new Credential')
        expect(addEditSource).not.toContain('Failed to save Credential')
        expect(addEditSource).not.toContain('Failed to save credential')
        expect(addEditSource).not.toContain('Failed to open authorization window. Please check if popups are blocked.')
        expect(addEditSource).not.toContain('OAuth2 authorization failed')
        expect(addEditSource).not.toContain('Invalid response from authorization endpoint')
        expect(addEditSource).not.toContain('Unknown error')
        expect(addEditSource).not.toContain('Cannot edit shared credential.')
        expect(addEditSource).not.toContain('Credential Name')
        expect(addEditSource).not.toContain('Authenticate')
    })
})
