const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const requiredKeys = [
    'pages.variables.addTitle',
    'pages.variables.editTitle',
    'pages.variables.variableName',
    'pages.variables.type',
    'pages.variables.value',
    'pages.variables.staticType',
    'pages.variables.runtimeType',
    'pages.variables.staticDescription',
    'pages.variables.runtimeDescription',
    'pages.variables.colName',
    'pages.variables.colValue',
    'pages.variables.colType',
    'pages.variables.colLastUpdated',
    'pages.variables.colCreated',
    'pages.variables.deleteTitle',
    'pages.variables.deleteConfirm',
    'pages.variables.howToUseButton',
    'pages.variables.howToUseDialog.title',
    'pages.variables.howToUseDialog.customUsage',
    'pages.variables.howToUseDialog.textFieldUsage',
    'pages.variables.howToUseDialog.textFieldExample',
    'pages.variables.howToUseDialog.typeUsage',
    'pages.variables.howToUseDialog.overrideUsagePrefix',
    'pages.variables.howToUseDialog.overrideUsageSuffix',
    'pages.variables.howToUseDialog.readMore',
    'pages.variables.howToUseDialog.docs'
]

const get = (obj, path) => path.split('.').reduce((acc, part) => acc?.[part], obj)

describe('variables i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('translates the add/edit variable dialog labels and options', () => {
        const source = require('fs').readFileSync(require('path').join(__dirname, '../views/variables/AddEditVariableDialog.jsx'), 'utf8')

        expect(source).toContain("t('pages.variables.staticType')")
        expect(source).toContain("t('pages.variables.runtimeType')")
        expect(source).toContain("t('pages.variables.addTitle')")
        expect(source).toContain("t('pages.variables.editTitle')")
        expect(source).toContain("t('pages.variables.variableName')")
        expect(source).toContain("t('pages.variables.type')")
        expect(source).toContain("t('pages.variables.value')")
        expect(source).not.toContain("'Add Variable'")
        expect(source).not.toContain("'Edit Variable'")
        expect(source).not.toContain('>Variable Name')
        expect(source).not.toContain('>Type')
        expect(source).not.toContain('>Value')
    })

    it('translates the variable list table, type chip, dialog props, and delete confirmation', () => {
        const source = require('fs').readFileSync(require('path').join(__dirname, '../views/variables/index.jsx'), 'utf8')

        expect(source).toContain("cancelButtonName: t('common.cancel')")
        expect(source).toContain("confirmButtonName: t('common.add')")
        expect(source).toContain("confirmButtonName: t('common.save')")
        expect(source).toContain("t('pages.variables.deleteTitle')")
        expect(source).toContain("t('pages.variables.deleteConfirm'")
        expect(source).toContain("t('pages.variables.colName')")
        expect(source).toContain("t('pages.variables.colValue')")
        expect(source).toContain("t('pages.variables.colType')")
        expect(source).toContain("t('pages.variables.colLastUpdated')")
        expect(source).toContain("t('pages.variables.colCreated')")
        expect(source).toContain('getVariableTypeLabel')
        expect(source).toContain('dateFormat')
        expect(source).not.toContain('<StyledTableCell>Name</StyledTableCell>')
        expect(source).not.toContain('<StyledTableCell>Value</StyledTableCell>')
        expect(source).not.toContain('<StyledTableCell>Type</StyledTableCell>')
    })
})
