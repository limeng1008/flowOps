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
    'pages.workspaces.statusInactive',
    'pages.schedule.history',
    'pages.schedule.active',
    'pages.schedule.disabled',
    'pages.schedule.lastRun',
    'pages.schedule.nextRun',
    'pages.schedule.dueNow',
    'pages.schedule.localTime',
    'pages.schedule.expected',
    'pages.schedule.autoRefresh',
    'pages.schedule.selectRowsToDelete',
    'pages.schedule.deleteSelected',
    'pages.schedule.noRunsYet',
    'pages.schedule.nextFire',
    'pages.schedule.status',
    'pages.schedule.scheduledAt',
    'pages.schedule.duration',
    'pages.schedule.deleteLogsTitle',
    'pages.schedule.deleteLogsDescription',
    'pages.schedule.deleting',
    'pages.schedule.deletedLogs',
    'pages.schedule.deleteFailed',
    'pages.schedule.loadExecutionFailedTitle',
    'pages.schedule.unknownError',
    'pages.schedule.failedBeforeStart',
    'pages.schedule.skippedTitle',
    'pages.schedule.skippedDescription',
    'pages.schedule.noDetails',
    'pages.schedule.statusOk',
    'pages.schedule.statusFailed',
    'pages.schedule.statusSkipped',
    'pages.schedule.statusQueued',
    'pages.schedule.statusRunning',
    'pages.schedule.everyDayAt',
    'pages.schedule.everyWeekdayAt',
    'pages.schedule.everyHour',
    'pages.schedule.everyMinute',
    'pages.webhookListener.title',
    'pages.webhookListener.liveObservatory',
    'pages.webhookListener.endpoint',
    'pages.webhookListener.processFlow',
    'pages.webhookListener.response',
    'pages.webhookListener.copied',
    'pages.webhookListener.copyUrl',
    'pages.webhookListener.copyCurl',
    'pages.webhookListener.curlExample',
    'pages.webhookListener.restoreWidth',
    'pages.webhookListener.expand',
    'pages.webhookListener.streaming',
    'pages.webhookListener.waiting',
    'pages.webhookListener.sendMethod',
    'pages.webhookListener.openingStream',
    'pages.webhookListener.flowStarted',
    'pages.webhookListener.listenerError',
    'pages.webhookListener.executionError',
    'pages.webhookListener.listenerDisconnected',
    'pages.webhookListener.registerFailed',
    'pages.webhookListener.completedWithoutText',
    'pages.webhookListener.statusConnecting',
    'pages.webhookListener.statusIdle',
    'pages.webhookListener.statusListening',
    'pages.webhookListener.statusRunning',
    'pages.webhookListener.statusCompleted',
    'pages.webhookListener.statusStopped',
    'pages.webhookListener.statusError',
    'pages.evaluators.newEvaluator',
    'pages.evaluators.noEvaluators',
    'pages.evaluators.deleteTitle',
    'pages.evaluators.deleteConfirm',
    'pages.evaluators.deleted',
    'pages.evaluators.deleteFailed',
    'pages.evaluators.addTitle',
    'pages.evaluators.editTitle',
    'pages.evaluators.evaluatorType',
    'pages.evaluators.selectType',
    'pages.evaluators.availableEvaluators',
    'pages.evaluators.selectEvaluator',
    'pages.evaluators.selectOperator',
    'pages.evaluators.outputSchema',
    'pages.evaluators.outputSchemaHelp',
    'pages.evaluators.prompt',
    'pages.evaluators.loadSamples',
    'pages.evaluators.promptRuntimeValues',
    'pages.evaluators.evaluationPrompt',
    'pages.evaluators.updated',
    'pages.evaluators.updateFailed',
    'pages.evaluators.added',
    'pages.evaluators.addFailed',
    'pages.evaluators.typeNumeric',
    'pages.evaluators.typeText',
    'pages.evaluators.typeJson',
    'pages.evaluators.typeLlm',
    'pages.evaluators.measure',
    'pages.evaluators.operator',
    'pages.evaluators.outputSchemaElements',
    'pages.evaluators.none',
    'pages.evaluators.actualOutput',
    'pages.evaluators.samplePrompts',
    'pages.evaluators.availablePrompts',
    'pages.evaluators.selectPrompt',
    'pages.evaluators.llmJsonOutputHelp',
    'pages.evaluators.property',
    'pages.evaluators.description',
    'pages.evaluators.required',
    'pages.evaluators.optionLabels.containsAny',
    'pages.evaluators.optionLabels.containsAll',
    'pages.evaluators.optionLabels.doesNotContainAny',
    'pages.evaluators.optionLabels.doesNotContainAll',
    'pages.evaluators.optionLabels.startsWith',
    'pages.evaluators.optionLabels.notStartsWith',
    'pages.evaluators.optionLabels.isValidJson',
    'pages.evaluators.optionLabels.isNotValidJson',
    'pages.evaluators.optionLabels.totalTokens',
    'pages.evaluators.optionLabels.promptTokens',
    'pages.evaluators.optionLabels.completionTokens',
    'pages.evaluators.optionLabels.apiLatency',
    'pages.evaluators.optionLabels.llmLatency',
    'pages.evaluators.optionLabels.chatflowLatency',
    'pages.evaluators.optionLabels.responseLength',
    'pages.evaluators.optionLabels.evaluateText',
    'pages.evaluators.optionLabels.evaluateJson',
    'pages.evaluators.optionLabels.evaluateNumeric',
    'pages.evaluators.optionLabels.llmGrading',
    'pages.evaluators.optionLabels.equals',
    'pages.evaluators.optionLabels.notEquals',
    'pages.evaluators.optionLabels.greaterThan',
    'pages.evaluators.optionLabels.lessThan',
    'pages.evaluators.optionLabels.greaterThanOrEquals',
    'pages.evaluators.optionLabels.lessThanOrEquals',
    'pages.evaluators.optionLabels.correctness',
    'pages.evaluators.optionLabels.hallucination',
    'pages.evaluators.optionDescriptions.containsAny',
    'pages.evaluators.optionDescriptions.containsAll',
    'pages.evaluators.optionDescriptions.doesNotContainAny',
    'pages.evaluators.optionDescriptions.doesNotContainAll',
    'pages.evaluators.optionDescriptions.startsWith',
    'pages.evaluators.optionDescriptions.notStartsWith',
    'pages.evaluators.optionDescriptions.isValidJson',
    'pages.evaluators.optionDescriptions.isNotValidJson',
    'pages.evaluators.optionDescriptions.totalTokens',
    'pages.evaluators.optionDescriptions.promptTokens',
    'pages.evaluators.optionDescriptions.completionTokens',
    'pages.evaluators.optionDescriptions.apiLatency',
    'pages.evaluators.optionDescriptions.llmLatency',
    'pages.evaluators.optionDescriptions.chatflowLatency',
    'pages.evaluators.optionDescriptions.responseLength',
    'pages.evaluators.optionDescriptions.evaluateText',
    'pages.evaluators.optionDescriptions.evaluateJson',
    'pages.evaluators.optionDescriptions.evaluateNumeric',
    'pages.evaluators.optionDescriptions.llmGrading',
    'pages.evaluations.newEvaluation',
    'pages.evaluations.startNewEvaluation',
    'pages.evaluations.enableAutoRefresh',
    'pages.evaluations.disableAutoRefresh',
    'pages.evaluations.noEvaluations',
    'pages.evaluations.deleteSelected',
    'pages.evaluations.deleteTitle',
    'pages.evaluations.deleteAllVersionsConfirm',
    'pages.evaluations.deleteVersionsConfirm',
    'pages.evaluations.deleted',
    'pages.evaluations.deleteFailed',
    'pages.evaluations.createFailed',
    'pages.evaluations.unknownError',
    'pages.evaluations.latestVersion',
    'pages.evaluations.averageMetrics',
    'pages.evaluations.lastEvaluated',
    'pages.evaluations.lastRun',
    'pages.evaluations.flows',
    'pages.evaluations.dataset',
    'pages.evaluations.status',
    'pages.evaluations.viewResults',
    'pages.evaluations.totalRunsMetric',
    'pages.evaluations.avgLatencyMetric',
    'pages.evaluations.passRateMetric',
    'pages.evaluations.notAvailable',
    'pages.evaluations.statusPending',
    'pages.evaluations.statusCompleted',
    'pages.evaluations.statusError',
    'pages.evaluations.stepDatasets',
    'pages.evaluations.stepEvaluators',
    'pages.evaluations.stepLlmMetrics',
    'pages.evaluations.fillMandatory',
    'pages.evaluations.selectDatasetTitle',
    'pages.evaluations.selectDatasetDescription',
    'pages.evaluations.computedMetrics',
    'pages.evaluations.customEvaluatorsTitle',
    'pages.evaluations.customEvaluatorsDescription',
    'pages.evaluations.gradeWithLlmTitle',
    'pages.evaluations.gradeWithLlmDescription',
    'pages.evaluations.evaluationNameHelp',
    'pages.evaluations.evaluationPlaceholder',
    'pages.evaluations.datasetToUse',
    'pages.evaluations.selectDataset',
    'pages.evaluations.datasetAsConversation',
    'pages.evaluations.selectFlows',
    'pages.evaluations.flowTypeAgentflowsV2',
    'pages.evaluations.flowTypeCustomAssistants',
    'pages.evaluations.flowTypeCustomAssistant',
    'pages.evaluations.selectEvaluators',
    'pages.evaluations.useLlmToGrade',
    'pages.evaluations.noGrading',
    'pages.evaluations.enterModelName',
    'pages.evaluations.modelName',
    'pages.evaluations.selectCredential',
    'pages.evaluations.connectCredential',
    'pages.evaluations.previousStep',
    'pages.evaluations.skipEvaluators',
    'pages.evaluations.skip',
    'pages.evaluations.next',
    'pages.evaluations.pass',
    'pages.evaluations.fail',
    'pages.evaluations.details',
    'pages.evaluations.evaluationId',
    'pages.evaluations.input',
    'pages.evaluations.expectedOutput',
    'pages.evaluations.actualOutput',
    'pages.evaluations.latencyMetrics',
    'pages.evaluations.tokens',
    'pages.evaluations.node',
    'pages.evaluations.providerModel',
    'pages.evaluations.total',
    'pages.evaluations.cost',
    'pages.evaluations.customEvaluators',
    'pages.evaluations.evaluatorLabel',
    'pages.evaluations.llmGraded',
    'pages.evaluations.apiMetric',
    'pages.evaluations.chainMetric',
    'pages.evaluations.retrieverMetric',
    'pages.evaluations.toolMetric',
    'pages.evaluations.llmMetric',
    'pages.evaluations.totalMetric',
    'pages.evaluations.promptMetric',
    'pages.evaluations.completionMetric'
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

    it('localizes schedule history and webhook listener runtime panels', () => {
        const scheduleFabSource = read('views/schedule/ScheduleHistoryFAB.jsx')
        const scheduleDrawerSource = read('views/schedule/ScheduleHistoryDrawer.jsx')
        const webhookFabSource = read('views/webhooklistener/WebhookListenerFAB.jsx')
        const webhookDrawerSource = read('views/webhooklistener/WebhookListenerDrawer.jsx')

        expect(scheduleFabSource).toContain('const { t } = useTranslation()')
        expect(scheduleFabSource).toContain("title={t('pages.schedule.history')}")
        expect(scheduleFabSource).not.toContain("title='Schedule History'")

        expect(scheduleDrawerSource).toContain("t('pages.schedule.history')")
        expect(scheduleDrawerSource).toContain("label={enabled ? t('pages.schedule.active') : t('pages.schedule.disabled')}")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.lastRun')")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.nextRun')")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.autoRefresh')")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.selectRowsToDelete')")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.deleteSelected'")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.noRunsYet')")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.status')")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.scheduledAt')")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.duration')")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.deleteLogsTitle'")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.deleteLogsDescription')")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.deletedLogs'")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.deleteFailed'")
        expect(scheduleDrawerSource).toContain('getScheduleStatusLabel')
        expect(scheduleDrawerSource).not.toContain('Schedule History')
        expect(scheduleDrawerSource).not.toContain("label={enabled ? 'Active' : 'Disabled'}")
        expect(scheduleDrawerSource).not.toContain('Last run')
        expect(scheduleDrawerSource).not.toContain('Next run')
        expect(scheduleDrawerSource).not.toContain('Auto-refresh')
        expect(scheduleDrawerSource).not.toContain('Select rows to delete')
        expect(scheduleDrawerSource).not.toContain('Scheduled At')
        expect(scheduleDrawerSource).not.toContain('This will also permanently delete')
        expect(scheduleDrawerSource).not.toContain('Deleting…')

        expect(webhookFabSource).toContain('const { t } = useTranslation()')
        expect(webhookFabSource).toContain("title={t('pages.webhookListener.title')}")
        expect(webhookFabSource).not.toContain("title='Webhook Listener'")

        expect(webhookDrawerSource).toContain("t('pages.webhookListener.title')")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.liveObservatory')")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.endpoint')")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.processFlow')")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.response')")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.copied')")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.copyUrl')")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.copyCurl')")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.curlExample')")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.waiting')")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.sendMethod'")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.openingStream')")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.flowStarted')")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.listenerError')")
        expect(webhookDrawerSource).toContain("t('pages.webhookListener.completedWithoutText')")
        expect(webhookDrawerSource).toContain('getWebhookStatusLabel')
        expect(webhookDrawerSource).not.toContain('Live observatory')
        expect(webhookDrawerSource).not.toContain('Copy URL')
        expect(webhookDrawerSource).not.toContain('cURL example')
        expect(webhookDrawerSource).not.toContain('Process flow')
        expect(webhookDrawerSource).not.toContain('Waiting for an incoming webhook request')
        expect(webhookDrawerSource).not.toContain('Opening event stream')
        expect(webhookDrawerSource).not.toContain('Flow started')
        expect(webhookDrawerSource).not.toContain('Flow completed without a text response.')
    })

    it('localizes evaluator list, dialogs, sample prompts, and reusable evaluator option labels', () => {
        const evaluatorsSource = read('views/evaluators/index.jsx')
        const evaluatorDialogSource = read('views/evaluators/AddEditEvaluatorDialog.jsx')
        const samplePromptSource = read('views/evaluators/SamplePromptDialog.jsx')
        const constantsSource = read('views/evaluators/evaluatorConstant.js')
        const promptConstantsSource = read('views/evaluators/evaluationPrompts.js')
        const createEvalSource = read('views/evaluations/CreateEvaluationDialog.jsx')
        const resultDrawerSource = read('views/evaluations/EvaluationResultSideDrawer.jsx')

        expect(evaluatorsSource).toContain('const { t, i18n } = useTranslation()')
        expect(evaluatorsSource).toContain("t('pages.evaluators.newEvaluator')")
        expect(evaluatorsSource).toContain("t('pages.evaluators.noEvaluators')")
        expect(evaluatorsSource).toContain("t('pages.evaluators.deleteTitle')")
        expect(evaluatorsSource).toContain("t('pages.evaluators.deleteConfirm'")
        expect(evaluatorsSource).toContain("message: t('pages.evaluators.deleted')")
        expect(evaluatorsSource).toContain("t('pages.evaluators.deleteFailed'")
        expect(evaluatorsSource).toContain("label={t('pages.evaluators.typeNumeric')}")
        expect(evaluatorsSource).toContain("label={t('pages.evaluators.typeText')}")
        expect(evaluatorsSource).toContain("label={t('pages.evaluators.typeJson')}")
        expect(evaluatorsSource).toContain("label={t('pages.evaluators.typeLlm')}")
        expect(evaluatorsSource).toContain("t('pages.evaluators.measure')")
        expect(evaluatorsSource).toContain("t('pages.evaluators.operator')")
        expect(evaluatorsSource).toContain("t('pages.evaluators.prompt')")
        expect(evaluatorsSource).toContain("t('pages.evaluators.outputSchemaElements')")
        expect(evaluatorsSource).toContain("t('pages.evaluators.none')")
        expect(evaluatorsSource).toContain('dateTimeFormat')
        expect(evaluatorsSource).toContain('getEvaluatorOptionLabel')
        expect(evaluatorsSource).not.toContain('New Evaluator')
        expect(evaluatorsSource).not.toContain('No Evaluators Yet')
        expect(evaluatorsSource).not.toContain('Evaluator deleted')
        expect(evaluatorsSource).not.toContain("label='Numeric'")
        expect(evaluatorsSource).not.toContain('Output Schema Elements')
        expect(evaluatorsSource).not.toContain("format('MMMM Do YYYY, hh:mm A')")

        expect(evaluatorDialogSource).toContain("t('pages.evaluators.addTitle')")
        expect(evaluatorDialogSource).toContain("t('pages.evaluators.editTitle')")
        expect(evaluatorDialogSource).toContain("t('pages.evaluators.evaluatorType')")
        expect(evaluatorDialogSource).toContain("defaultOption={t('pages.evaluators.selectType')}")
        expect(evaluatorDialogSource).toContain("t('pages.evaluators.availableEvaluators')")
        expect(evaluatorDialogSource).toContain("defaultOption={t('pages.evaluators.selectEvaluator')}")
        expect(evaluatorDialogSource).toContain("t('pages.evaluators.selectOperator')")
        expect(evaluatorDialogSource).toContain("t('pages.evaluators.outputSchema')")
        expect(evaluatorDialogSource).toContain("title={t('pages.evaluators.outputSchemaHelp')}")
        expect(evaluatorDialogSource).toContain("t('pages.evaluators.loadSamples')")
        expect(evaluatorDialogSource).toContain("t('pages.evaluators.prompt')")
        expect(evaluatorDialogSource).toContain("t('pages.evaluators.promptRuntimeValues',")
        expect(evaluatorDialogSource).toContain("label: t('pages.evaluators.evaluationPrompt')")
        expect(evaluatorDialogSource).toContain("message: t('pages.evaluators.updated'")
        expect(evaluatorDialogSource).toContain("t('pages.evaluators.updateFailed'")
        expect(evaluatorDialogSource).toContain("message: t('pages.evaluators.added')")
        expect(evaluatorDialogSource).toContain("t('pages.evaluators.addFailed'")
        expect(evaluatorDialogSource).toContain("headerName: t('pages.evaluators.property')")
        expect(evaluatorDialogSource).toContain("headerName: t('common.type')")
        expect(evaluatorDialogSource).toContain("headerName: t('pages.evaluators.description')")
        expect(evaluatorDialogSource).toContain("headerName: t('pages.evaluators.required')")
        expect(evaluatorDialogSource).toContain('localizeEvaluatorOptions')
        expect(evaluatorDialogSource).not.toContain('Add Evaluator')
        expect(evaluatorDialogSource).not.toContain('Evaluator Type')
        expect(evaluatorDialogSource).not.toContain('Select Type')
        expect(evaluatorDialogSource).not.toContain('Load from Pre defined Samples')
        expect(evaluatorDialogSource).not.toContain('You can use')
        expect(evaluatorDialogSource).not.toContain('New Evaluator added')

        expect(samplePromptSource).toContain('const { t } = useTranslation()')
        expect(samplePromptSource).toContain('getLocalizedEvaluationPrompts')
        expect(samplePromptSource).toContain("t('pages.evaluators.samplePrompts')")
        expect(samplePromptSource).toContain("t('pages.evaluators.availablePrompts')")
        expect(samplePromptSource).toContain("defaultOption={t('pages.evaluators.selectPrompt')}")
        expect(samplePromptSource).toContain("t('pages.evaluators.outputSchema')")
        expect(samplePromptSource).toContain("title={t('pages.evaluators.llmJsonOutputHelp')}")
        expect(samplePromptSource).toContain("t('pages.evaluators.prompt')")
        expect(samplePromptSource).toContain("t('pages.evaluators.selectPrompt')")
        expect(samplePromptSource).not.toContain('Sample Prompts')
        expect(samplePromptSource).not.toContain('Available Prompts')
        expect(samplePromptSource).not.toContain('Instruct the LLM to give formatted JSON output')

        expect(constantsSource).toContain('labelKey')
        expect(constantsSource).toContain('descriptionKey')
        expect(constantsSource).not.toContain("label: 'Contains Any'")
        expect(constantsSource).not.toContain("description: 'Returns true")
        expect(promptConstantsSource).toContain('labelKey')
        expect(promptConstantsSource).not.toContain("label: 'Correctness'")
        expect(promptConstantsSource).not.toContain("label: 'Hallucination'")

        expect(createEvalSource).toContain('getEvaluatorOptionLabel')
        expect(createEvalSource).toContain('getEvaluatorOptionLabel(evaluatorsOptions, evaluator.name, t)')
        expect(resultDrawerSource).toContain('getEvaluatorOptionLabel')
        expect(resultDrawerSource).toContain("t('pages.evaluators.actualOutput')")
    })

    it('localizes evaluations list and create-evaluation wizard visible copy', () => {
        const evaluationsSource = read('views/evaluations/index.jsx')
        const createDialogSource = read('views/evaluations/CreateEvaluationDialog.jsx')

        expect(evaluationsSource).toContain('const { t, i18n } = useTranslation()')
        expect(evaluationsSource).toContain("confirmButtonName: t('pages.evaluations.startNewEvaluation')")
        expect(evaluationsSource).toContain("t('pages.evaluations.deleteAllVersionsConfirm'")
        expect(evaluationsSource).toContain("t('pages.evaluations.deleteVersionsConfirm'")
        expect(evaluationsSource).toContain("message: t('pages.evaluations.deleted'")
        expect(evaluationsSource).toContain("t('pages.evaluations.deleteFailed'")
        expect(evaluationsSource).toContain("t('pages.evaluations.createFailed'")
        expect(evaluationsSource).toContain(
            "title={autoRefresh ? t('pages.evaluations.disableAutoRefresh') : t('pages.evaluations.enableAutoRefresh')}"
        )
        expect(evaluationsSource).toContain("t('pages.evaluations.newEvaluation')")
        expect(evaluationsSource).toContain("t('pages.evaluations.deleteSelected'")
        expect(evaluationsSource).toContain("t('pages.evaluations.noEvaluations')")
        expect(evaluationsSource).toContain("t('pages.evaluations.latestVersion')")
        expect(evaluationsSource).toContain("t('pages.evaluations.averageMetrics')")
        expect(evaluationsSource).toContain("t('pages.evaluations.lastEvaluated')")
        expect(evaluationsSource).toContain("t('pages.evaluations.lastRun')")
        expect(evaluationsSource).toContain("t('pages.evaluations.flows')")
        expect(evaluationsSource).toContain("t('pages.evaluations.dataset')")
        expect(evaluationsSource).toContain("t('pages.evaluations.status')")
        expect(evaluationsSource).toContain("t('pages.evaluations.viewResults')")
        expect(evaluationsSource).toContain("t('pages.evaluations.totalRunsMetric'")
        expect(evaluationsSource).toContain("t('pages.evaluations.avgLatencyMetric'")
        expect(evaluationsSource).toContain("t('pages.evaluations.passRateMetric'")
        expect(evaluationsSource).toContain('formatEvaluationDate')
        expect(evaluationsSource).toContain('getEvaluationStatusLabel')
        expect(evaluationsSource).not.toContain('New Evaluation')
        expect(evaluationsSource).not.toContain('No Evaluations Yet')
        expect(evaluationsSource).not.toContain('Latest Version')
        expect(evaluationsSource).not.toContain('Average Metrics')
        expect(evaluationsSource).not.toContain('Total Runs:')
        expect(evaluationsSource).not.toContain('Avg Latency:')
        expect(evaluationsSource).not.toContain('Pass Rate:')
        expect(evaluationsSource).not.toContain('View Results')
        expect(evaluationsSource).not.toContain("format('DD-MMM-YYYY, hh:mm:ss A')")

        expect(createDialogSource).toContain("t('pages.evaluations.stepDatasets')")
        expect(createDialogSource).toContain("t('pages.evaluations.stepEvaluators')")
        expect(createDialogSource).toContain("t('pages.evaluations.stepLlmMetrics')")
        expect(createDialogSource).toContain("t('pages.evaluations.startNewEvaluation')")
        expect(createDialogSource).toContain("t('pages.evaluations.fillMandatory')")
        expect(createDialogSource).toContain("t('pages.evaluations.selectDatasetTitle')")
        expect(createDialogSource).toContain("t('pages.evaluations.selectDatasetDescription')")
        expect(createDialogSource).toContain("t('pages.evaluations.computedMetrics')")
        expect(createDialogSource).toContain("t('pages.evaluations.customEvaluatorsTitle')")
        expect(createDialogSource).toContain("t('pages.evaluations.customEvaluatorsDescription')")
        expect(createDialogSource).toContain("t('pages.evaluations.gradeWithLlmTitle')")
        expect(createDialogSource).toContain("t('pages.evaluations.gradeWithLlmDescription')")
        expect(createDialogSource).toContain("title={t('pages.evaluations.evaluationNameHelp')}")
        expect(createDialogSource).toContain("placeholder={t('pages.evaluations.evaluationPlaceholder')}")
        expect(createDialogSource).toContain("t('pages.evaluations.datasetToUse')")
        expect(createDialogSource).toContain("defaultOption={t('pages.evaluations.selectDataset')}")
        expect(createDialogSource).toContain("t('pages.evaluations.datasetAsConversation')")
        expect(createDialogSource).toContain("t('pages.evaluations.selectFlows')")
        expect(createDialogSource).toContain("t('pages.evaluations.flowTypeAgentflowsV2')")
        expect(createDialogSource).toContain("t('pages.evaluations.flowTypeCustomAssistants')")
        expect(createDialogSource).toContain("t('pages.evaluations.selectEvaluators')")
        expect(createDialogSource).toContain("t('pages.evaluations.useLlmToGrade')")
        expect(createDialogSource).toContain("t('pages.evaluations.noGrading')")
        expect(createDialogSource).toContain("t('pages.evaluations.enterModelName')")
        expect(createDialogSource).toContain("placeholder={t('pages.evaluations.modelName')}")
        expect(createDialogSource).toContain("t('pages.evaluations.selectCredential')")
        expect(createDialogSource).toContain("label: t('pages.evaluations.connectCredential')")
        expect(createDialogSource).toContain("title={t('pages.evaluations.previousStep')}")
        expect(createDialogSource).toContain("title={t('pages.evaluations.skipEvaluators')}")
        expect(createDialogSource).toContain("t('pages.evaluations.skip')")
        expect(createDialogSource).toContain("t('pages.evaluations.next')")
        expect(createDialogSource).toContain("t('pages.evaluations.pass')")
        expect(createDialogSource).toContain("t('pages.evaluations.fail')")
        expect(createDialogSource).not.toContain('Start New Evaluation')
        expect(createDialogSource).not.toContain('Fill all the mandatory fields')
        expect(createDialogSource).not.toContain('Select dataset to be tested on flows')
        expect(createDialogSource).not.toContain('Friendly name to tag this run.')
        expect(createDialogSource).not.toContain('Select Dataset')
        expect(createDialogSource).not.toContain('Agentflows (v2)')
        expect(createDialogSource).not.toContain('Custom Assistants')
        expect(createDialogSource).not.toContain('Select the Evaluators')
        expect(createDialogSource).not.toContain('No Grading')
        expect(createDialogSource).not.toContain('Model Name')
        expect(createDialogSource).not.toContain('Previous Step')
    })

    it('localizes evaluation result side drawers visible copy and dates', () => {
        const resultDrawerSource = read('views/evaluations/EvaluationResultSideDrawer.jsx')
        const versionsDrawerSource = read('views/evaluations/EvaluationResultVersionsSideDrawer.jsx')
        const metricsCardSource = read('views/evaluations/MetricsItemCard.jsx')

        expect(resultDrawerSource).toContain("t('pages.evaluations.details')")
        expect(resultDrawerSource).toContain("t('pages.evaluations.evaluationId')")
        expect(resultDrawerSource).toContain("t('pages.evaluations.input')")
        expect(resultDrawerSource).toContain("t('pages.evaluations.expectedOutput')")
        expect(resultDrawerSource).toContain("t('pages.evaluations.actualOutput')")
        expect(resultDrawerSource).toContain("t('common.error')")
        expect(resultDrawerSource).toContain("t('pages.evaluations.latencyMetrics')")
        expect(resultDrawerSource).toContain("t('pages.evaluations.tokens')")
        expect(resultDrawerSource).toContain("t('pages.evaluations.node')")
        expect(resultDrawerSource).toContain("t('pages.evaluations.providerModel')")
        expect(resultDrawerSource).toContain("t('pages.evaluations.total')")
        expect(resultDrawerSource).toContain("t('pages.evaluations.cost')")
        expect(resultDrawerSource).toContain("t('pages.evaluations.customEvaluators')")
        expect(resultDrawerSource).toContain("t('pages.evaluations.evaluatorLabel'")
        expect(resultDrawerSource).toContain("t('pages.evaluations.llmGraded')")
        expect(resultDrawerSource).toContain('getEvaluationMetricLabel')
        expect(resultDrawerSource).toContain('getEvaluationResultLabel')
        expect(resultDrawerSource).toContain("'pages.evaluations.apiMetric'")
        expect(resultDrawerSource).toContain("'pages.evaluations.promptMetric'")
        expect(resultDrawerSource).toContain("'pages.evaluations.completionMetric'")
        expect(resultDrawerSource).not.toContain('Evaluation Details')
        expect(resultDrawerSource).not.toContain('Evaluation Id')
        expect(resultDrawerSource).not.toContain('Expected Output')
        expect(resultDrawerSource).not.toContain('Actual Output')
        expect(resultDrawerSource).not.toContain('Latency Metrics')
        expect(resultDrawerSource).not.toContain('Provider & Model')
        expect(resultDrawerSource).not.toContain('Custom Evaluators')
        expect(resultDrawerSource).not.toContain('LLM Graded')
        expect(resultDrawerSource).not.toContain("'API: '")
        expect(resultDrawerSource).not.toContain("'Prompt: '")
        expect(resultDrawerSource).not.toContain('Evaluator: ${evaluator.name}')

        expect(versionsDrawerSource).toContain('const { t, i18n } = useTranslation()')
        expect(versionsDrawerSource).toContain('formatEvaluationDate')
        expect(versionsDrawerSource).not.toContain("format('DD-MMM-YYYY, hh:mm:ss A')")

        expect(metricsCardSource).not.toContain("'PASS RATE'")
        expect(metricsCardSource).not.toContain("'TOKENS USED'")
        expect(metricsCardSource).not.toContain("'LATENCY (ms)'")
    })
})
