const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const requiredKeys = [
    'pages.datasets.rows',
    'pages.datasets.addTitle',
    'pages.datasets.editTitle',
    'pages.datasets.datasetTitle',
    'pages.datasets.uploadCsv',
    'pages.datasets.newItem',
    'pages.datasets.input',
    'pages.datasets.expectedOutput',
    'pages.datasets.anticipatedOutput',
    'pages.datasets.chooseFile',
    'pages.datasets.firstRowHeaders',
    'pages.datasets.csvFormat',
    'pages.datasets.deleteTitle',
    'pages.datasets.deleteConfirm',
    'pages.datasets.deleted',
    'pages.datasets.deleteFailed',
    'pages.datasets.added',
    'pages.datasets.addFailed',
    'pages.datasets.saved',
    'pages.datasets.saveFailed',
    'pages.datasets.deleteItemsConfirm',
    'pages.datasets.itemsDeleted',
    'pages.datasets.deleteItemsFailed',
    'pages.datasets.selectedItems',
    'pages.datasets.reorderHelp',
    'pages.datasets.addItemTitle',
    'pages.datasets.editItemTitle',
    'pages.datasets.rowAdded',
    'pages.datasets.rowAddFailed',
    'pages.datasets.rowSaved',
    'pages.datasets.rowSaveFailed',
    'pages.datasets.uploadItemsTitle',
    'pages.workspaces.searchPlaceholder',
    'pages.workspaces.active',
    'pages.workspaces.role',
    'pages.workspaces.noWorkspaces',
    'pages.workspaces.deleteWorkspaceTitle',
    'pages.workspaces.deleteWorkspaceConfirm',
    'pages.workspaces.deleted',
    'pages.workspaces.deleteFailed',
    'pages.workspaces.deletingWorkspace',
    'pages.workspaces.organizationOwner',
    'pages.workspaces.personalWorkspace',
    'pages.workspaces.addTitle',
    'pages.workspaces.editTitle',
    'pages.workspaces.reservedName',
    'pages.workspaces.added',
    'pages.workspaces.addFailed',
    'pages.workspaces.saved',
    'pages.workspaces.saveFailed',
    'pages.workspaces.changeRoleTitle',
    'pages.workspaces.newRoleToAssign',
    'pages.workspaces.selectRole',
    'pages.workspaces.userRoleUpdated',
    'pages.workspaces.userRoleUpdateFailed',
    'pages.workspaces.workspaceUsersTitle',
    'pages.workspaces.workspaceUsersDescription',
    'pages.workspaces.sendInvite',
    'pages.workspaces.updateInvite',
    'pages.workspaces.updateRole',
    'pages.workspaces.removeUsers',
    'pages.workspaces.removeUsersConfirm',
    'pages.workspaces.remove',
    'pages.workspaces.organizationOwnerCannotRemove',
    'pages.workspaces.usersRemoved',
    'pages.workspaces.unlinkFailed',
    'pages.workspaces.noAssignedUsers',
    'pages.workspaces.emailName',
    'pages.workspaces.status',
    'pages.workspaces.lastLogin',
    'pages.workspaces.never',
    'pages.workspaces.statusActive',
    'pages.workspaces.statusInvited',
    'pages.workspaces.statusInactive'
]

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)
const read = (filePath) => fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8')

describe('views long-tail i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('localizes datasets list and dataset rows visible copy, confirms, notifications, and dates', () => {
        const datasetsSource = read('views/datasets/index.jsx')
        const rowsSource = read('views/datasets/DatasetItems.jsx')

        expect(datasetsSource).toContain('const { t, i18n } = useTranslation()')
        expect(datasetsSource).toContain("cancelButtonName: t('common.cancel')")
        expect(datasetsSource).toContain("confirmButtonName: t('common.add')")
        expect(datasetsSource).toContain("confirmButtonName: t('common.save')")
        expect(datasetsSource).toContain("t('pages.datasets.rows')")
        expect(datasetsSource).toContain("t('pages.datasets.deleteTitle')")
        expect(datasetsSource).toContain("t('pages.datasets.deleteConfirm'")
        expect(datasetsSource).toContain("message: t('pages.datasets.deleted')")
        expect(datasetsSource).toContain("t('pages.datasets.deleteFailed'")
        expect(datasetsSource).toContain('dateTimeFormat')
        expect(datasetsSource).not.toContain('<TableCell>Rows</TableCell>')
        expect(datasetsSource).not.toContain('Delete dataset')
        expect(datasetsSource).not.toContain('Dataset deleted')
        expect(datasetsSource).not.toContain('Failed to delete dataset:')
        expect(datasetsSource).not.toContain("format('MMMM Do YYYY, hh:mm A')")

        expect(rowsSource).toContain("t('pages.datasets.datasetTitle'")
        expect(rowsSource).toContain("confirmButtonName: t('pages.datasets.uploadCsv')")
        expect(rowsSource).toContain("t('pages.datasets.uploadCsv')")
        expect(rowsSource).toContain("t('pages.datasets.newItem')")
        expect(rowsSource).toContain("t('pages.datasets.selectedItems'")
        expect(rowsSource).toContain("t('pages.datasets.deleteItemsConfirm'")
        expect(rowsSource).toContain("message: t('pages.datasets.itemsDeleted')")
        expect(rowsSource).toContain("t('pages.datasets.deleteItemsFailed'")
        expect(rowsSource).toContain("t('pages.datasets.input')")
        expect(rowsSource).toContain("t('pages.datasets.expectedOutput')")
        expect(rowsSource).toContain("t('pages.datasets.reorderHelp')")
        expect(rowsSource).not.toContain('Upload CSV')
        expect(rowsSource).not.toContain('New Item')
        expect(rowsSource).not.toContain('Delete ${selected.length} dataset items?')
        expect(rowsSource).not.toContain('Dataset Items deleted')
        expect(rowsSource).not.toContain('<StyledTableCell>Input</StyledTableCell>')
        expect(rowsSource).not.toContain('Expected Output')
        expect(rowsSource).not.toContain('Use the drag icon')
    })

    it('localizes dataset edit, row edit, and CSV upload dialogs', () => {
        const datasetDialogSource = read('views/datasets/AddEditDatasetDialog.jsx')
        const rowDialogSource = read('views/datasets/AddEditDatasetRowDialog.jsx')
        const uploadSource = read('views/datasets/UploadCSVFileDialog.jsx')

        expect(datasetDialogSource).toContain("t('pages.datasets.addTitle')")
        expect(datasetDialogSource).toContain("t('pages.datasets.editTitle')")
        expect(datasetDialogSource).toContain("message: t('pages.datasets.added')")
        expect(datasetDialogSource).toContain("t('pages.datasets.addFailed'")
        expect(datasetDialogSource).toContain("message: t('pages.datasets.saved')")
        expect(datasetDialogSource).toContain("t('pages.datasets.saveFailed'")
        expect(datasetDialogSource).toContain("t('pages.datasets.uploadCsv')")
        expect(datasetDialogSource).toContain("t('pages.datasets.csvFormat')")
        expect(datasetDialogSource).toContain("selectedFile ?? t('pages.datasets.chooseFile')")
        expect(datasetDialogSource).toContain("label={t('pages.datasets.firstRowHeaders')}")
        expect(datasetDialogSource).not.toContain('New Dataset added')
        expect(datasetDialogSource).not.toContain('Failed to add new Dataset:')
        expect(datasetDialogSource).not.toContain('Add Dataset')
        expect(datasetDialogSource).not.toContain('Choose a file to upload')

        expect(rowDialogSource).toContain('const { t } = useTranslation()')
        expect(rowDialogSource).toContain("t('pages.datasets.addItemTitle'")
        expect(rowDialogSource).toContain("t('pages.datasets.editItemTitle'")
        expect(rowDialogSource).toContain("message: t('pages.datasets.rowAdded')")
        expect(rowDialogSource).toContain("t('pages.datasets.rowAddFailed'")
        expect(rowDialogSource).toContain("message: t('pages.datasets.rowSaved')")
        expect(rowDialogSource).toContain("t('pages.datasets.rowSaveFailed'")
        expect(rowDialogSource).toContain("t('pages.datasets.input')")
        expect(rowDialogSource).toContain("t('pages.datasets.anticipatedOutput')")
        expect(rowDialogSource).not.toContain('New Row added for the given Dataset')
        expect(rowDialogSource).not.toContain('Failed to add new row in the Dataset:')
        expect(rowDialogSource).not.toContain('Anticipated Output')

        expect(uploadSource).toContain('const { t } = useTranslation()')
        expect(uploadSource).toContain("t('pages.datasets.uploadItemsTitle'")
        expect(uploadSource).toContain("t('pages.datasets.uploadCsv')")
        expect(uploadSource).toContain("t('pages.datasets.csvFormat')")
        expect(uploadSource).toContain("selectedFile ?? t('pages.datasets.chooseFile')")
        expect(uploadSource).toContain("label={t('pages.datasets.firstRowHeaders')}")
        expect(uploadSource).toContain("message: t('pages.datasets.rowAdded')")
        expect(uploadSource).toContain("t('pages.datasets.rowAddFailed'")
        expect(uploadSource).not.toContain('Upload Items to [')
        expect(uploadSource).not.toContain('Choose a file to upload')
    })

    it('localizes workspace list, workspace dialogs, users list, and role updates', () => {
        const workspaceSource = read('views/workspace/index.jsx')
        const workspaceDialogSource = read('views/workspace/AddEditWorkspaceDialog.jsx')
        const roleDialogSource = read('views/workspace/EditWorkspaceUserRoleDialog.jsx')
        const usersSource = read('views/workspace/WorkspaceUsers.jsx')

        expect(workspaceSource).toContain('const { t, i18n } = useTranslation()')
        expect(workspaceSource).toContain("label={t('pages.workspaces.active')}")
        expect(workspaceSource).toContain("t('pages.workspaces.role')")
        expect(workspaceSource).toContain("t('pages.workspaces.organizationOwner')")
        expect(workspaceSource).toContain("t('pages.workspaces.personalWorkspace')")
        expect(workspaceSource).toContain("searchPlaceholder={t('pages.workspaces.searchPlaceholder')}")
        expect(workspaceSource).toContain("t('pages.workspaces.noWorkspaces')")
        expect(workspaceSource).toContain("t('pages.workspaces.deleteWorkspaceTitle'")
        expect(workspaceSource).toContain("t('pages.workspaces.deleteWorkspaceConfirm')")
        expect(workspaceSource).toContain("message: t('pages.workspaces.deleted')")
        expect(workspaceSource).toContain("t('pages.workspaces.deleteFailed'")
        expect(workspaceSource).toContain("t('layout.switchingWorkspace')")
        expect(workspaceSource).toContain("t('pages.workspaces.deletingWorkspace')")
        expect(workspaceSource).toContain('dateTimeFormat')
        expect(workspaceSource).not.toContain("label={'Active'}")
        expect(workspaceSource).not.toContain('Search Workspaces')
        expect(workspaceSource).not.toContain('No Workspaces Yet')
        expect(workspaceSource).not.toContain('Workspace deleted')
        expect(workspaceSource).not.toContain('Deleting workspace...')
        expect(workspaceSource).not.toContain("format('MMMM Do YYYY, hh:mm A')")

        expect(workspaceDialogSource).toContain("t('pages.workspaces.addTitle')")
        expect(workspaceDialogSource).toContain("t('pages.workspaces.editTitle')")
        expect(workspaceDialogSource).toContain("message: t('pages.workspaces.reservedName')")
        expect(workspaceDialogSource).toContain("message: t('pages.workspaces.added')")
        expect(workspaceDialogSource).toContain("t('pages.workspaces.addFailed'")
        expect(workspaceDialogSource).toContain("message: t('pages.workspaces.saved')")
        expect(workspaceDialogSource).toContain("t('pages.workspaces.saveFailed'")
        expect(workspaceDialogSource).not.toContain('Workspace name cannot be Default Workspace')
        expect(workspaceDialogSource).not.toContain('New Workspace added')
        expect(workspaceDialogSource).not.toContain('Add Workspace')

        expect(roleDialogSource).toContain('const { t } = useTranslation()')
        expect(roleDialogSource).toContain("t('pages.workspaces.changeRoleTitle'")
        expect(roleDialogSource).toContain("t('pages.workspaces.newRoleToAssign')")
        expect(roleDialogSource).toContain("placeholder={t('pages.workspaces.selectRole')}")
        expect(roleDialogSource).toContain("message: t('pages.workspaces.userRoleUpdated')")
        expect(roleDialogSource).toContain("t('pages.workspaces.userRoleUpdateFailed'")
        expect(roleDialogSource).not.toContain('Change Workspace Role - ')
        expect(roleDialogSource).not.toContain('WorkspaceUser Details Updated')
        expect(roleDialogSource).not.toContain('New Role to Assign')

        expect(usersSource).toContain("searchPlaceholder={t('pages.users.searchPlaceholder')}")
        expect(usersSource).toContain("t('pages.workspaces.workspaceUsersTitle'")
        expect(usersSource).toContain("description={t('pages.workspaces.workspaceUsersDescription')}")
        expect(usersSource).toContain("t('pages.workspaces.removeUsers')")
        expect(usersSource).toContain("t('pages.workspaces.removeUsersConfirm'")
        expect(usersSource).toContain("confirmButtonName: t('pages.workspaces.remove')")
        expect(usersSource).toContain("message: t('pages.workspaces.organizationOwnerCannotRemove')")
        expect(usersSource).toContain("message: t('pages.workspaces.usersRemoved'")
        expect(usersSource).toContain("t('pages.workspaces.unlinkFailed'")
        expect(usersSource).toContain("t('pages.workspaces.noAssignedUsers')")
        expect(usersSource).toContain("t('pages.workspaces.emailName')")
        expect(usersSource).toContain("t('pages.workspaces.role')")
        expect(usersSource).toContain("t('pages.workspaces.status')")
        expect(usersSource).toContain("t('pages.workspaces.lastLogin')")
        expect(usersSource).toContain("t('pages.workspaces.never')")
        expect(usersSource).toContain('getStatusLabel')
        expect(usersSource).not.toContain('Search Users')
        expect(usersSource).not.toContain('Workspace Users')
        expect(usersSource).not.toContain('Remove Users')
        expect(usersSource).not.toContain('No Assigned Users Yet')
        expect(usersSource).not.toContain('Email/Name')
        expect(usersSource).not.toContain('Never')
    })
})
