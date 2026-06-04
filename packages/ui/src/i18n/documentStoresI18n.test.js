const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const documentStoreDetailKeys = [
    'pages.documentStores.viewEditChunks',
    'pages.documentStores.upsertAllChunks',
    'pages.documentStores.retrievalQuery',
    'pages.documentStores.refresh',
    'pages.documentStores.previewProcess',
    'pages.documentStores.upsertChunks',
    'pages.documentStores.viewApi',
    'pages.documentStores.delete'
]

const showStoredChunksKeys = [
    'pages.documentStores.showingChunks',
    'pages.documentStores.charactersCount',
    'pages.documentStores.chunkCharacters',
    'pages.documentStores.noChunks',
    'pages.documentStores.deleteChunkTitle',
    'pages.documentStores.deleteChunkConfirm'
]

const documentStoreDialogKeys = ['pages.documentStores.addNewTitle', 'pages.documentStores.editTitle', 'pages.documentStores.renameTitle']

const documentStoreListKeys = [
    'pages.documentStores.connectedFlowsCount',
    'pages.documentStores.totalCharsCount',
    'pages.documentStores.totalChunksCount',
    'pages.documentStores.moreLoaderTypes',
    'pages.documentStores.colConnectedFlows',
    'pages.documentStores.colTotalChars',
    'pages.documentStores.colTotalChunks',
    'pages.documentStores.colLoaderTypes',
    'pages.documentStores.noDocumentStores',
    'pages.documentStores.deleteStoreTitle',
    'pages.documentStores.deleteStoreConfirm',
    'pages.documentStores.deleteStoreWithVectorConfirm',
    'pages.documentStores.status.stale',
    'pages.documentStores.status.empty',
    'pages.documentStores.status.syncing',
    'pages.documentStores.status.upserting',
    'pages.documentStores.status.sync',
    'pages.documentStores.status.upserted',
    'pages.documentStores.status.new'
]

const vectorStoreConfigureKeys = [
    'pages.documentStores.stepEmbeddings',
    'pages.documentStores.stepVectorStore',
    'pages.documentStores.stepRecordManager',
    'pages.documentStores.selectEmbeddings',
    'pages.documentStores.selectEmbeddingsProvider',
    'pages.documentStores.selectVectorStore',
    'pages.documentStores.selectVectorStoreProvider',
    'pages.documentStores.selectRecordManager',
    'pages.documentStores.recordManagerNotApplicable',
    'pages.documentStores.configureSubtitle',
    'pages.documentStores.saveConfig'
]

const documentStoreInputKeys = [
    'pages.documentStores.chooseFileToUpload',
    'pages.documentStores.manageScrapedLinksTitle',
    'pages.documentStores.fetchLinks',
    'pages.documentStores.fetchedLinksSuccess',
    'pages.documentStores.scrapedLinks',
    'pages.documentStores.clearAllLinks',
    'pages.documentStores.clearAll',
    'pages.documentStores.noScrapedLinks',
    'pages.documentStores.manageLinks'
]

const requiredKeys = [
    ...documentStoreDetailKeys,
    ...showStoredChunksKeys,
    ...documentStoreDialogKeys,
    ...documentStoreListKeys,
    ...vectorStoreConfigureKeys,
    ...documentStoreInputKeys
]

const menuLabels = [
    'View & Edit Chunks',
    'Upsert All Chunks',
    'Retrieval Query',
    'Preview & Process',
    'Upsert Chunks',
    'View API',
    'Delete'
]

const chunkPageHardcodedLabels = ['No Chunks', 'Characters:']

const get = (obj, path) => path.split('.').reduce((acc, part) => acc?.[part], obj)
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

describe('document store i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it.each(documentStoreDetailKeys)('uses the %s key in DocumentStoreDetail', (key) => {
        const source = fs.readFileSync(path.join(__dirname, '../views/docstore/DocumentStoreDetail.jsx'), 'utf8')

        expect(source).toContain(`t('${key}')`)
    })

    it.each(menuLabels)('does not hard-code "%s" in DocumentStoreDetail', (label) => {
        const source = fs.readFileSync(path.join(__dirname, '../views/docstore/DocumentStoreDetail.jsx'), 'utf8')
        const textNodePattern = new RegExp(`>\\s*${escapeRegExp(label)}\\s*<`)

        expect(source).not.toMatch(textNodePattern)
    })

    it.each(showStoredChunksKeys)('uses the %s key in ShowStoredChunks', (key) => {
        const source = fs.readFileSync(path.join(__dirname, '../views/docstore/ShowStoredChunks.jsx'), 'utf8')

        expect(source).toContain(`t('${key}'`)
    })

    it.each(chunkPageHardcodedLabels)('does not hard-code "%s" in ShowStoredChunks', (label) => {
        const source = fs.readFileSync(path.join(__dirname, '../views/docstore/ShowStoredChunks.jsx'), 'utf8')

        expect(source).not.toContain(label)
    })

    it('translates loader and splitter node labels in ShowStoredChunks', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/docstore/ShowStoredChunks.jsx'), 'utf8')

        expect(source).toContain("import { translateNodeLabel } from '@/i18n/nodeI18n'")
        expect(source).toContain('translateNodeLabel(loaderName')
        expect(source).toContain('translateNodeLabel(getChunksApi.data?.file?.splitterName')
    })

    it('translates the add document store dialog fields and actions', () => {
        const dialogSource = fs.readFileSync(path.join(__dirname, '../views/docstore/AddDocStoreDialog.jsx'), 'utf8')
        const listSource = fs.readFileSync(path.join(__dirname, '../views/docstore/index.jsx'), 'utf8')

        expect(dialogSource).toContain("t('common.name')")
        expect(dialogSource).toContain("t('common.description')")
        expect(dialogSource).toContain("t('common.cancel')")
        expect(listSource).toContain("confirmButtonName: t('common.add')")
        expect(listSource).toContain("title: t('pages.documentStores.renameTitle')")
        expect(dialogSource).not.toContain('>Cancel<')
        expect(dialogSource).not.toContain('<Typography>Description</Typography>')
    })

    it('translates document store card actions, status, and summary chips', () => {
        const listSource = fs.readFileSync(path.join(__dirname, '../views/docstore/index.jsx'), 'utf8')
        const cardSource = fs.readFileSync(path.join(__dirname, '../ui-component/cards/DocumentStoreCard.jsx'), 'utf8')
        const statusSource = fs.readFileSync(path.join(__dirname, '../views/docstore/DocumentStoreStatus.jsx'), 'utf8')

        expect(listSource).toContain("t('common.rename')")
        expect(listSource).toContain("t('common.delete')")
        expect(cardSource).toContain("t('pages.documentStores.connectedFlowsCount'")
        expect(cardSource).toContain("t('pages.documentStores.totalCharsCount'")
        expect(cardSource).toContain("t('pages.documentStores.totalChunksCount'")
        expect(cardSource).toContain("t('pages.documentStores.moreLoaderTypes'")
        expect(statusSource).toContain('statusI18nKeyMap')
        expect(statusSource).toContain('t(statusI18nKeyMap[status]')
        expect(cardSource).not.toContain("'flow'")
        expect(cardSource).not.toContain("'flows'")
        expect(cardSource).not.toContain(' chars')
        expect(cardSource).not.toContain(' chunks')
    })

    it('translates the document store table headers', () => {
        const tableSource = fs.readFileSync(path.join(__dirname, '../ui-component/table/DocumentStoreTable.jsx'), 'utf8')

        expect(tableSource).toContain("t('common.name')")
        expect(tableSource).toContain("t('common.description')")
        expect(tableSource).toContain("t('pages.documentStores.colConnectedFlows')")
        expect(tableSource).toContain("t('pages.documentStores.colTotalChars')")
        expect(tableSource).toContain("t('pages.documentStores.colTotalChunks')")
        expect(tableSource).toContain("t('pages.documentStores.colLoaderTypes')")
    })

    it('translates vector store configuration steps, cards, dialogs, and actions', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/docstore/VectorStoreConfigure.jsx'), 'utf8')

        vectorStoreConfigureKeys.forEach((key) => {
            expect(source).toContain(key)
        })
        expect(source).toContain('{t(label)}</StepLabel>')
        expect(source).toContain("t('pages.documentStores.selectEmbeddingsProvider')")
        expect(source).toContain("t('pages.documentStores.selectVectorStoreProvider')")
        expect(source).toContain("t('pages.documentStores.selectRecordManager')")
        expect(source).toContain("t('pages.documentStores.saveConfig')")
        expect(source).not.toContain("'Select a Vector Store Provider'")
        expect(source).not.toContain("'Select a Record Manager'")
        expect(source).not.toContain('>Save Config<')
        expect(source).not.toContain("t('pages.assistants.selectVectorStore')")
    })

    it('routes document store embedded node input copy through node i18n', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/docstore/DocStoreInputHandler.jsx'), 'utf8')

        expect(source).toContain('translateNodeLabel')
        expect(source).toContain('translateNodeTooltip')
        expect(source).toContain('translateNodeInputPlaceholder')
        expect(source).toContain('{tL(inputParam.label)}')
        expect(source).toContain('title={tT(inputParam.description)}')
        expect(source).toContain('placeholder={tP(inputParam.placeholder)}')
        expect(source).toContain("confirmButtonName: t('common.save')")
        expect(source).toContain("cancelButtonName: t('common.cancel')")
        expect(source).toContain("t('pages.documentStores.chooseFileToUpload')")
        expect(source).toContain("t('common.chooseOption')")
        expect(source).toContain("t('pages.documentStores.manageLinks')")
        expect(source).not.toContain('{inputParam.label}')
        expect(source).not.toContain('title={inputParam.description}')
        expect(source).not.toContain('placeholder={inputParam.placeholder}')
        expect(source).not.toContain("'Choose a file to upload'")
        expect(source).not.toContain("'choose an option'")
        expect(source).not.toContain('>Manage Links<')
    })

    it('translates document store embedded node titles and provider list labels', () => {
        const configureSource = fs.readFileSync(path.join(__dirname, '../views/docstore/VectorStoreConfigure.jsx'), 'utf8')
        const listSource = fs.readFileSync(path.join(__dirname, '../views/docstore/ComponentsListDialog.jsx'), 'utf8')

        expect(configureSource).toContain('translateNodeLabel')
        expect(configureSource).toContain('translateNodeLabel(selectedEmbeddingsProvider.label, currentLang)')
        expect(configureSource).toContain('translateNodeLabel(selectedVectorStoreProvider.label, currentLang)')
        expect(configureSource).toContain('translateNodeLabel(selectedRecordManagerProvider.label, currentLang)')
        expect(listSource).toContain('translateNodeLabel(loader.label, currentLang)')
        expect(configureSource).not.toContain('{selectedEmbeddingsProvider.label}')
        expect(configureSource).not.toContain('{selectedVectorStoreProvider.label}')
        expect(configureSource).not.toContain('{selectedRecordManagerProvider.label}')
        expect(listSource).not.toContain('<Typography>{loader.label}</Typography>')
    })

    it('translates document store helper dialogs, actions, and notifications', () => {
        const expandSource = fs.readFileSync(path.join(__dirname, '../ui-component/dialog/ExpandTextDialog.jsx'), 'utf8')
        const scrapedLinksSource = fs.readFileSync(path.join(__dirname, '../ui-component/dialog/ManageScrapedLinksDialog.jsx'), 'utf8')

        expect(expandSource).toContain('translateNodeLabel(inputParam.label, currentLang)')
        expect(expandSource).toContain('translateNodeInputPlaceholder(inputParam.placeholder, currentLang)')
        expect(expandSource).toContain("t('common.execute')")
        expect(expandSource).toContain("dialogProps.cancelButtonName || t('common.cancel')")
        expect(expandSource).toContain("dialogProps.confirmButtonName || t('common.save')")
        expect(expandSource).not.toContain("<Typography variant='h4'>{inputParam.label}</Typography>")
        expect(expandSource).not.toContain('placeholder={inputParam.placeholder}')
        expect(expandSource).not.toContain('>Execute<')

        documentStoreInputKeys.slice(1, -1).forEach((key) => {
            expect(scrapedLinksSource).toContain(`t('${key}'`)
        })
        expect(scrapedLinksSource).not.toContain('Successfully fetched links')
        expect(scrapedLinksSource).not.toContain('Manage Scraped Links')
        expect(scrapedLinksSource).not.toContain('>Fetch Links<')
        expect(scrapedLinksSource).not.toContain('>Scraped Links<')
        expect(scrapedLinksSource).not.toContain('Clear All Links')
        expect(scrapedLinksSource).not.toContain('>Clear All<')
        expect(scrapedLinksSource).not.toContain('Links scraped from the URL will appear here')
    })
})
