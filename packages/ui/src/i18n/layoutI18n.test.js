const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const requiredKeys = [
    'common.back',
    'common.import',
    'common.beta',
    'layout.githubStar',
    'layout.upgrade',
    'layout.loggingOut',
    'layout.documentation',
    'layout.menuItemsError',
    'layout.switchingWorkspace',
    'layout.switchingOrganization',
    'layout.workspaceUnavailable',
    'layout.workspaceUnavailableDescription',
    'layout.workspaceUnavailableOrgDescription',
    'layout.selectWorkspace',
    'layout.selectOrganization',
    'layout.workspaceSwitchError',
    'layout.contactAdministrator',
    'layout.failedSwitchWorkspace',
    'layout.organization',
    'layout.workspace',
    'layout.organizationName',
    'profile.exportDialogTitle',
    'profile.exporting',
    'profile.exportingWait',
    'profile.importing',
    'profile.importingWait',
    'profile.importAllSuccess',
    'profile.invalidImportedFile',
    'profile.importFailed',
    'profile.exportAllFailed',
    'profile.exportFailed',
    'profile.exportData.agentflows',
    'profile.exportData.agentflowsV2',
    'profile.exportData.assistantsCustom',
    'profile.exportData.assistantsOpenAI',
    'profile.exportData.assistantsAzure',
    'profile.exportData.chatflows',
    'profile.exportData.chatMessages',
    'profile.exportData.chatFeedbacks',
    'profile.exportData.customTemplates',
    'profile.exportData.documentStores',
    'profile.exportData.executions',
    'profile.exportData.tools',
    'profile.exportData.variables'
]

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)
const read = (filePath) => fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8')

describe('layout i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('localizes profile export/import dialog copy and notifications outside JSX text nodes', () => {
        const source = read('layout/MainLayout/Header/ProfileSection/index.jsx')

        expect(source).toContain('label={t(data.labelKey)}')
        expect(source).toContain("t('profile.exportDialogTitle')")
        expect(source).toContain("t('profile.exporting')")
        expect(source).toContain("t('profile.exportingWait')")
        expect(source).toContain("t('profile.importing')")
        expect(source).toContain("t('profile.importingWait')")
        expect(source).toContain("message: t('profile.importAllSuccess')")
        expect(source).toContain("t('profile.invalidImportedFile')")
        expect(source).toContain("t('profile.importFailed'")
        expect(source).toContain("t('profile.exportAllFailed'")
        expect(source).toContain("t('profile.exportFailed'")

        expect(source).not.toContain('Select Data to Export')
        expect(source).not.toContain('Exporting data might takes a while')
        expect(source).not.toContain('Importing data might takes a while')
        expect(source).not.toContain('Import All successful')
        expect(source).not.toContain('Invalid Imported File')
        expect(source).not.toContain('Failed to import:')
        expect(source).not.toContain('Failed to export all:')
        expect(source).not.toContain('Failed to export:')
    })

    it('localizes header and workspace switcher layout text', () => {
        const headerSource = read('layout/MainLayout/Header/index.jsx')
        const cloudMenuSource = read('layout/MainLayout/Sidebar/CloudMenuList.jsx')
        const workspaceSwitcherSource = read('layout/MainLayout/Header/WorkspaceSwitcher/index.jsx')
        const breadcrumbsSource = read('layout/MainLayout/Header/OrgWorkspaceBreadcrumbs/index.jsx')

        expect(headerSource).toContain("t('layout.githubStar')")
        expect(headerSource).toContain("message: t('layout.loggingOut')")
        expect(headerSource).toContain("t('layout.upgrade')")
        expect(headerSource).not.toContain('Logging out...')
        expect(headerSource).not.toContain('>Upgrade<')

        expect(cloudMenuSource).toContain("message: t('layout.loggingOut')")
        expect(cloudMenuSource).toContain("t('layout.documentation')")
        expect(cloudMenuSource).toContain("t('profile.logout')")
        expect(cloudMenuSource).not.toContain('Logging out...')
        expect(cloudMenuSource).not.toContain('Documentation')
        expect(cloudMenuSource).not.toContain('>Logout<')

        for (const source of [workspaceSwitcherSource, breadcrumbsSource]) {
            expect(source).toContain("t('layout.switchingWorkspace')")
            expect(source).toContain("t('layout.workspaceUnavailable')")
            expect(source).toContain("t('layout.workspaceUnavailableDescription')")
            expect(source).toContain("t('layout.selectWorkspace')")
            expect(source).not.toContain('Switching workspace...')
            expect(source).not.toContain('Workspace Unavailable')
            expect(source).not.toContain('Your current workspace is no longer available.')
            expect(source).not.toContain('Select Workspace')
        }

        expect(workspaceSwitcherSource).toContain("t('layout.failedSwitchWorkspace')")
        expect(workspaceSwitcherSource).toContain("t('layout.workspaceSwitchError')")
        expect(workspaceSwitcherSource).toContain("t('layout.contactAdministrator')")
        expect(workspaceSwitcherSource).toContain("t('profile.logout')")
        expect(workspaceSwitcherSource).not.toContain('Failed to switch workspace')
        expect(workspaceSwitcherSource).not.toContain('Workspace Switch Error')
        expect(workspaceSwitcherSource).not.toContain('Please contact your administrator for assistance.')

        expect(breadcrumbsSource).toContain("t('layout.switchingOrganization')")
        expect(breadcrumbsSource).toContain("t('layout.workspaceUnavailableOrgDescription')")
        expect(breadcrumbsSource).toContain("t('layout.selectOrganization')")
        expect(breadcrumbsSource).toContain("t('layout.organization')")
        expect(breadcrumbsSource).toContain("t('layout.workspace')")
        expect(breadcrumbsSource).toContain("t('layout.organizationName'")
        expect(breadcrumbsSource).not.toContain('Switching organization...')
        expect(breadcrumbsSource).not.toContain('Select Organization')
        expect(breadcrumbsSource).not.toContain('Workspace is no longer available.')
        expect(breadcrumbsSource).not.toContain("'s Organization")
    })

    it('localizes ViewHeader defaults and sidebar fallback labels', () => {
        const viewHeaderSource = read('layout/MainLayout/ViewHeader.jsx')
        const menuListSource = read('layout/MainLayout/Sidebar/MenuList/index.jsx')
        const navGroupSource = read('layout/MainLayout/Sidebar/MenuList/NavGroup/index.jsx')
        const navCollapseSource = read('layout/MainLayout/Sidebar/MenuList/NavCollapse/index.jsx')
        const navItemSource = read('layout/MainLayout/Sidebar/MenuList/NavItem/index.jsx')

        expect(viewHeaderSource).toContain('const { t } = useTranslation()')
        expect(viewHeaderSource).toContain('const localizedSearchPlaceholder = searchPlaceholder || t')
        expect(viewHeaderSource).toContain("title={t('common.back')}")
        expect(viewHeaderSource).toContain("title={t('common.edit')}")
        expect(viewHeaderSource).not.toContain("searchPlaceholder = 'Search'")
        expect(viewHeaderSource).not.toContain("title='Back'")
        expect(viewHeaderSource).not.toContain("title='Edit'")

        for (const source of [menuListSource, navGroupSource, navCollapseSource]) {
            expect(source).toContain("t('layout.menuItemsError')")
            expect(source).not.toContain('Menu Items Error')
        }

        expect(navItemSource).toContain("label={t('common.beta')}")
        expect(navItemSource).not.toContain("label={'BETA'}")
    })
})
