const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const requiredKeys = [
    'pages.chatflows.share.copyLink',
    'pages.chatflows.share.openNewTab',
    'pages.chatflows.share.makePublic',
    'pages.chatflows.share.makePublicHelp',
    'pages.chatflows.share.titleSettings',
    'pages.chatflows.share.generalSettings',
    'pages.chatflows.share.botMessage',
    'pages.chatflows.share.userMessage',
    'pages.chatflows.share.textInput',
    'pages.chatflows.share.title',
    'pages.chatflows.share.titleAvatarLink',
    'pages.chatflows.share.titleBackgroundColor',
    'pages.chatflows.share.titleTextColor',
    'pages.chatflows.share.welcomeMessage',
    'pages.chatflows.share.errorMessage',
    'pages.chatflows.share.backgroundColor',
    'pages.chatflows.share.fontSize',
    'pages.chatflows.share.poweredByTextColor',
    'pages.chatflows.share.showAgentMessages',
    'pages.chatflows.share.renderHtml',
    'pages.chatflows.share.newSessionOnOpen',
    'pages.chatflows.share.textColor',
    'pages.chatflows.share.avatarLink',
    'pages.chatflows.share.showAvatar',
    'pages.chatflows.share.textInputPlaceholder',
    'pages.chatflows.share.sendButtonColor',
    'pages.chatflows.share.saveChanges',
    'pages.chatflows.share.saveFailed',
    'pages.chatflows.embed.pasteInBody',
    'pages.chatflows.embed.versionHelpPrefix',
    'pages.chatflows.embed.version',
    'pages.chatflows.embed.showConfig',
    'pages.chatflows.api.noAuthorization',
    'pages.chatflows.api.addNewKey',
    'pages.chatflows.api.chooseApiKey',
    'pages.chatflows.api.scheduledTriggerNotice',
    'pages.chatflows.api.webhookTriggerNotice',
    'pages.chatflows.api.webhookSignatureNotice',
    'pages.chatflows.api.webhookAsyncModeNotice',
    'pages.chatflows.api.webhookStreamModeNotice',
    'pages.chatflows.api.apiKeyEmbedWarning',
    'pages.chatflows.api.selectNoAuthorization',
    'pages.chatflows.api.showOverrideConfig',
    'pages.chatflows.api.overrideConfigHelp',
    'pages.chatflows.api.streamingHelp'
]

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)

describe('chatflow share and API dialog i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('routes Share Chatbot visible copy through i18n', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/chatflows/ShareChatbot.jsx'), 'utf8')

        expect(source).toContain("t('pages.chatflows.share.makePublic')")
        expect(source).toContain("t('pages.chatflows.share.titleSettings')")
        expect(source).toContain("t('pages.chatflows.share.generalSettings')")
        expect(source).toContain("t('pages.chatflows.share.saveChanges')")
        expect(source).not.toContain('Make Public')
        expect(source).not.toContain('Title Settings')
        expect(source).not.toContain('General Settings')
        expect(source).not.toContain('TextIntput Send Button Color')
    })

    it('routes Embed Chat visible copy through i18n', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/chatflows/EmbedChat.jsx'), 'utf8')

        expect(source).toContain("t('pages.chatflows.embed.pasteInBody')")
        expect(source).toContain("t('pages.chatflows.embed.showConfig')")
        expect(source).not.toContain('Paste this anywhere in the')
        expect(source).not.toContain('Show Embed Chat Config')
    })

    it('routes API code dialog visible copy through i18n', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/chatflows/APICodeDialog.jsx'), 'utf8')

        expect(source).toContain("label: t('pages.chatflows.api.noAuthorization')")
        expect(source).toContain("label: t('pages.chatflows.api.addNewKey')")
        expect(source).toContain("t('pages.chatflows.api.scheduledTriggerNotice')")
        expect(source).toContain("t('pages.chatflows.api.webhookTriggerNotice'")
        expect(source).toContain("t('pages.chatflows.api.showOverrideConfig')")
        expect(source).not.toContain('This flow is configured as a <b>Scheduled Trigger</b>')
        expect(source).not.toContain('This flow is configured as a <b>Webhook Trigger</b>')
        expect(source).not.toContain('You cannot use API key while embedding/sharing chatbot.')
        expect(source).not.toContain('Show Override Config')
    })
})
