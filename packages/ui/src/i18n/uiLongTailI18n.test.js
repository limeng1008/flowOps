const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const requiredKeys = [
    'common.chooseFileToUpload',
    'common.uploadFile',
    'common.viewDetails',
    'common.sending',
    'profile.currentVersion',
    'profile.latestVersion',
    'profile.publishedAt',
    'components.selectVariable.title',
    'components.selectVariable.questionDescription',
    'components.selectVariable.chatHistoryDescription',
    'components.selectVariable.fileAttachmentDescription',
    'components.selectVariable.allMessages',
    'components.selectVariable.stateValue',
    'components.selectVariable.firstMessageContent',
    'components.selectVariable.lastMessageContent',
    'components.selectVariable.outputFrom',
    'canvas.promptGenerator.placeholder',
    'canvas.promptGenerator.examples.summarizeDocument',
    'canvas.promptGenerator.examples.translateLanguage',
    'canvas.promptGenerator.examples.writeEmail',
    'canvas.promptGenerator.examples.convertCode',
    'canvas.promptGenerator.examples.researchReport',
    'canvas.promptGenerator.examples.planTrip',
    'pages.agentflows.v1DeprecatedTitle',
    'pages.agentflows.v1DeprecatedDescription',
    'pages.marketplaces.useCases',
    'pages.marketplaces.badges',
    'pages.marketplaces.sharedTemplate',
    'pages.vectorstore.upsertSuccess',
    'pages.executions.viewDetails'
]

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)

describe('ui long-tail i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('routes shared variable and file upload copy through i18n', () => {
        const selectVariableSource = fs.readFileSync(path.join(__dirname, '../ui-component/json/SelectVariable.jsx'), 'utf8')
        const fileSource = fs.readFileSync(path.join(__dirname, '../ui-component/file/File.jsx'), 'utf8')
        const nodeInputSource = fs.readFileSync(path.join(__dirname, '../views/canvas/NodeInputHandler.jsx'), 'utf8')

        expect(selectVariableSource).toContain("t('components.selectVariable.title')")
        expect(selectVariableSource).toContain("t('components.selectVariable.outputFrom'")
        expect(fileSource).toContain("t('common.chooseFileToUpload')")
        expect(fileSource).toContain("t('common.uploadFile')")
        expect(nodeInputSource).toContain("t('common.chooseFileToUpload')")
        expect(selectVariableSource).not.toContain('Select Variable')
        expect(fileSource).not.toContain('Upload File')
        expect(fileSource).not.toContain('Choose a file to upload')
    })

    it('routes misc dialog, marketplace, vectorstore, and chat message copy through i18n', () => {
        const aboutSource = fs.readFileSync(path.join(__dirname, '../ui-component/dialog/AboutDialog.jsx'), 'utf8')
        const promptGeneratorSource = fs.readFileSync(path.join(__dirname, '../ui-component/dialog/PromptGeneratorDialog.jsx'), 'utf8')
        const marketplaceTableSource = fs.readFileSync(path.join(__dirname, '../ui-component/table/MarketplaceTable.jsx'), 'utf8')
        const vectorStoreDialogSource = fs.readFileSync(path.join(__dirname, '../views/vectorstore/VectorStoreDialog.jsx'), 'utf8')
        const agentflowsSource = fs.readFileSync(path.join(__dirname, '../views/agentflows/index.jsx'), 'utf8')
        const chatMessageSource = fs.readFileSync(path.join(__dirname, '../views/chatmessage/ChatMessage.jsx'), 'utf8')
        const executedDataSource = fs.readFileSync(path.join(__dirname, '../views/chatmessage/AgentExecutedDataCard.jsx'), 'utf8')
        const reasoningSource = fs.readFileSync(path.join(__dirname, '../views/chatmessage/AgentReasoningCard.jsx'), 'utf8')

        expect(aboutSource).toContain("t('profile.currentVersion')")
        expect(promptGeneratorSource).toContain("t('canvas.promptGenerator.placeholder')")
        expect(marketplaceTableSource).toContain("t('pages.marketplaces.useCases')")
        expect(vectorStoreDialogSource).toContain("t('pages.vectorstore.upsertSuccess')")
        expect(agentflowsSource).toContain("t('pages.agentflows.v1DeprecatedTitle')")
        expect(chatMessageSource).toContain("t('common.sending')")
        expect(executedDataSource).toContain("t('pages.executions.noItemData')")
        expect(reasoningSource).toContain("t('pages.executions.state')")
        expect(aboutSource).not.toContain('Current Version')
        expect(promptGeneratorSource).not.toContain('Describe your task here')
        expect(marketplaceTableSource).not.toContain('Shared Template')
        expect(vectorStoreDialogSource).not.toContain('Successfully upserted vector store')
        expect(agentflowsSource).not.toContain('V1 Agentflows are deprecated.')
        expect(chatMessageSource).not.toContain('Sending...')
        expect(executedDataSource).not.toContain('No data available for this item')
        expect(reasoningSource).not.toContain("label={'State'}")
    })
})
