const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const requiredKeys = [
    'pages.assistants.cardCustomBadge',
    'pages.assistants.cardOpenAIBadge',
    'pages.assistants.searchPlaceholder',
    'pages.assistants.addNewCustomTitle',
    'pages.assistants.noCustomAssistants',
    'pages.assistants.openAIDescription',
    'pages.assistants.loadExistingTitle',
    'pages.assistants.addNewTitle',
    'pages.assistants.editTitle',
    'pages.assistants.noOpenAIAssistants',
    'pages.assistants.openAICredential',
    'pages.assistants.assistantModel',
    'pages.assistants.assistantName',
    'pages.assistants.assistantDescription',
    'pages.assistants.assistantInstruction',
    'pages.assistants.assistantTools',
    'pages.assistants.codeInterpreter',
    'pages.assistants.fileSearch',
    'pages.assistants.addVectorStore',
    'pages.assistants.selectVectorStore',
    'pages.assistants.deleteAssistantTitle',
    'pages.assistants.custom.saveAssistant',
    'pages.assistants.custom.selectModel',
    'pages.assistants.custom.instructions',
    'pages.assistants.custom.knowledgeDocumentStores',
    'pages.assistants.custom.tools',
    'pages.assistants.custom.preview'
]

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)
const readView = (relativePath) => fs.readFileSync(path.join(__dirname, '../views/assistants', relativePath), 'utf8')

describe('assistants i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('translates the assistant landing cards and badges', () => {
        const source = readView('index.jsx')

        expect(source).toContain("t('pages.assistants.cardCustomBadge')")
        expect(source).toContain("t('pages.assistants.cardOpenAIBadge')")
        expect(source).not.toContain("iconText: 'Custom'")
    })

    it('translates the custom assistant list and create dialog', () => {
        const listSource = readView('custom/CustomAssistantLayout.jsx')
        const dialogSource = readView('custom/AddCustomAssistantDialog.jsx')

        expect(listSource).toContain('useTranslation')
        expect(listSource).toContain("t('pages.assistants.cardCustomTitle')")
        expect(listSource).toContain("t('pages.assistants.searchPlaceholder')")
        expect(listSource).toContain("t('pages.assistants.noCustomAssistants')")
        expect(dialogSource).toContain('useTranslation')
        expect(dialogSource).toContain("t('pages.assistants.assistantName')")
        expect(dialogSource).not.toContain('>Name<')
        expect(listSource).not.toContain("'Search Assistants'")
        expect(listSource).not.toContain('No Custom Assistants Added Yet')
    })

    it('translates the OpenAI assistant list, form, and vector store dialog', () => {
        const listSource = readView('openai/OpenAIAssistantLayout.jsx')
        const assistantDialogSource = readView('openai/AssistantDialog.jsx')
        const loadDialogSource = readView('openai/LoadAssistantDialog.jsx')
        const vectorStoreDialogSource = readView('openai/AssistantVectorStoreDialog.jsx')

        expect(listSource).toContain("t('pages.assistants.cardOpenAITitle')")
        expect(listSource).toContain("t('pages.assistants.openAIDescription')")
        expect(listSource).toContain("t('pages.assistants.noOpenAIAssistants')")
        expect(assistantDialogSource).toContain("t('pages.assistants.assistantModel')")
        expect(assistantDialogSource).toContain("t('pages.assistants.assistantTools')")
        expect(assistantDialogSource).toContain("t('pages.assistants.addVectorStore')")
        expect(loadDialogSource).toContain("t('pages.assistants.openAICredential')")
        expect(vectorStoreDialogSource).toContain("t('pages.assistants.selectVectorStore')")
        expect(listSource).not.toContain("'OpenAI Assistant'")
        expect(assistantDialogSource).not.toContain('>Assistant Model')
        expect(assistantDialogSource).not.toContain('>Assistant Tools')
        expect(loadDialogSource).not.toContain('OpenAI Credential')
        expect(vectorStoreDialogSource).not.toContain('Select Vector Store')
    })

    it('translates the custom assistant configure and preview page', () => {
        const source = readView('custom/CustomAssistantConfigurePreview.jsx')

        expect(source).toContain('useTranslation')
        expect(source).toContain("t('pages.assistants.custom.selectModel')")
        expect(source).toContain("t('pages.assistants.custom.instructions')")
        expect(source).toContain("t('pages.assistants.custom.knowledgeDocumentStores')")
        expect(source).toContain("t('pages.assistants.custom.tools')")
        expect(source).toContain("t('pages.assistants.custom.saveAssistant')")
        expect(source).toContain("t('pages.assistants.custom.preview')")
        expect(source).not.toContain('Select Model')
        expect(source).not.toContain('Knowledge (Document Stores)')
        expect(source).not.toContain('Save Assistant')
    })
})
