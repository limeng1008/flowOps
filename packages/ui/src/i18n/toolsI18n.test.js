const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const requiredKeys = [
    'common.noRows',
    'common.addItemButton',
    'pages.tools.editTitle',
    'pages.tools.toolName',
    'pages.tools.toolNamePlaceholder',
    'pages.tools.toolNameHelp',
    'pages.tools.toolDescription',
    'pages.tools.toolDescriptionPlaceholder',
    'pages.tools.toolDescriptionHelp',
    'pages.tools.toolIconSource',
    'pages.tools.inputSchema',
    'pages.tools.inputSchemaHelp',
    'pages.tools.schemaProperty',
    'pages.tools.schemaType',
    'pages.tools.schemaDescription',
    'pages.tools.schemaRequired',
    'pages.tools.noSchemaRows',
    'pages.tools.pasteJson',
    'pages.tools.addItem',
    'pages.tools.javascriptFunction',
    'pages.tools.javascriptFunctionHelp',
    'pages.tools.howToUseFunction',
    'pages.tools.seeExample',
    'pages.tools.pasteJs',
    'pages.tools.exampleCommentLibraries',
    'pages.tools.exampleCommentSchemaVariables',
    'pages.tools.exampleCommentFlowConfig',
    'pages.tools.exampleCommentCustomVariables',
    'pages.tools.exampleCommentReturnString',
    'pages.tools.saveAsTemplate',
    'pages.tools.export',
    'pages.tools.useTemplate',
    'pages.tools.deleteTitle',
    'pages.tools.deleteConfirm',
    'pages.tools.pasteJsonTitle',
    'pages.tools.invalidJson',
    'pages.tools.invalidJsonArray',
    'pages.tools.noCustomMcpServers',
    'pages.tools.howToUseFunctionDialog.title',
    'pages.tools.howToUseFunctionDialog.libraries',
    'pages.tools.howToUseFunctionDialog.schemaVariables',
    'pages.tools.howToUseFunctionDialog.propertyLabel',
    'pages.tools.howToUseFunctionDialog.variableLabel',
    'pages.tools.howToUseFunctionDialog.flowConfig',
    'pages.tools.howToUseFunctionDialog.customVariables',
    'pages.tools.howToUseFunctionDialog.returnString'
]

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)

describe('tools i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('translates the tool dialog labels, placeholders, schema table, and actions', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/tools/ToolDialog.jsx'), 'utf8')

        expect(source).toContain("t('pages.tools.toolName')")
        expect(source).toContain("placeholder={t('pages.tools.toolNamePlaceholder')}")
        expect(source).toContain("t('pages.tools.toolDescription')")
        expect(source).toContain("placeholder={t('pages.tools.toolDescriptionPlaceholder')}")
        expect(source).toContain("t('pages.tools.toolIconSource')")
        expect(source).toContain("t('pages.tools.inputSchema')")
        expect(source).toContain("t('pages.tools.pasteJson')")
        expect(source).toContain("t('pages.tools.addItem')")
        expect(source).toContain("headerName: t('pages.tools.schemaProperty')")
        expect(source).toContain("headerName: t('pages.tools.schemaType')")
        expect(source).toContain("headerName: t('pages.tools.schemaDescription')")
        expect(source).toContain("headerName: t('pages.tools.schemaRequired')")
        expect(source).toContain("localeText={{ noRowsLabel: t('pages.tools.noSchemaRows') }}")
        expect(source).toContain("t('pages.tools.javascriptFunction')")
        expect(source).toContain("t('pages.tools.howToUseFunction')")
        expect(source).toContain("t('pages.tools.seeExample')")
        expect(source).toContain("placeholder={t('pages.tools.pasteJs')}")
        expect(source).toContain("t('pages.tools.exampleCommentLibraries')")
        expect(source).toContain("t('pages.tools.exampleCommentSchemaVariables')")
        expect(source).toContain('setToolFunc(getExampleAPIFunc(t))')
        expect(source).not.toContain('Tool Name')
        expect(source).not.toContain('Tool description')
        expect(source).not.toContain('Paste JSON')
        expect(source).not.toContain('Add Item')
        expect(source).not.toContain('You can use any libraries imported in FlowOps')
    })

    it('translates the tool dialog props, delete confirmation, and secondary JSON dialog', () => {
        const toolsSource = fs.readFileSync(path.join(__dirname, '../views/tools/index.jsx'), 'utf8')
        const dialogSource = fs.readFileSync(path.join(__dirname, '../views/tools/ToolDialog.jsx'), 'utf8')
        const pasteSource = fs.readFileSync(path.join(__dirname, '../views/tools/PasteJSONDialog.jsx'), 'utf8')
        const gridSource = fs.readFileSync(path.join(__dirname, '../ui-component/grid/Grid.jsx'), 'utf8')

        expect(toolsSource).toContain("title: t('pages.tools.editTitle')")
        expect(toolsSource).toContain("cancelButtonName: t('common.cancel')")
        expect(toolsSource).toContain("confirmButtonName: t('common.add')")
        expect(toolsSource).toContain("confirmButtonName: t('common.save')")
        expect(dialogSource).toContain("t('pages.tools.deleteTitle')")
        expect(dialogSource).toContain("t('pages.tools.deleteConfirm'")
        expect(pasteSource).toContain('useTranslation')
        expect(pasteSource).toContain("t('pages.tools.pasteJsonTitle')")
        expect(pasteSource).toContain("t('pages.tools.invalidJson')")
        expect(pasteSource).toContain("t('common.cancel')")
        expect(pasteSource).toContain("t('common.confirm')")
        expect(gridSource).toContain('localeText')
        expect(toolsSource).not.toContain("'Edit Tool'")
        expect(dialogSource).not.toContain('Delete tool ${toolName}?')
        expect(pasteSource).not.toContain('Paste JSON Schema')
        expect(pasteSource).not.toContain('Invalid JSON format. Please check your input.')
    })

    it('translates the how-to-use function dialog', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/tools/HowToUseFunctionDialog.jsx'), 'utf8')

        expect(source).toContain('useTranslation')
        expect(source).toContain("t('pages.tools.howToUseFunctionDialog.title')")
        expect(source).toContain("t('pages.tools.howToUseFunctionDialog.libraries')")
        expect(source).toContain("t('pages.tools.howToUseFunctionDialog.schemaVariables')")
        expect(source).toContain("t('pages.tools.howToUseFunctionDialog.propertyLabel')")
        expect(source).toContain("t('pages.tools.howToUseFunctionDialog.variableLabel')")
        expect(source).toContain("t('pages.tools.howToUseFunctionDialog.flowConfig')")
        expect(source).toContain("t('pages.tools.howToUseFunctionDialog.customVariables')")
        expect(source).toContain("t('pages.tools.howToUseFunctionDialog.returnString')")
        expect(source).not.toContain('How To Use Function')
        expect(source).not.toContain('You can use any libraries imported in FlowOps')
        expect(source).not.toContain('Property =')
        expect(source).not.toContain('Variable =')
    })

    it('translates the shared data grid actions used by node forms', () => {
        const source = fs.readFileSync(path.join(__dirname, '../ui-component/grid/DataGrid.jsx'), 'utf8')

        expect(source).toContain('useTranslation')
        expect(source).toContain("label={t('common.delete')}")
        expect(source).toContain("localeText={{ noRowsLabel: t('common.noRows') }}")
        expect(source).toContain("t('common.addItemButton')")
        expect(source).not.toContain('Add Item')
        expect(source).not.toContain("label='Delete'")
    })
})
