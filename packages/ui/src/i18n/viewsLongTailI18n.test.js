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
    'pages.evaluations.completionMetric',
    'pages.evaluations.evaluationTitle',
    'pages.evaluations.runAgainTitle',
    'pages.evaluations.runAgainDescription',
    'pages.evaluations.evaluationRunningRedirect',
    'pages.evaluations.versionLabel',
    'pages.evaluations.versionHistory',
    'pages.evaluations.reRunEvaluation',
    'pages.evaluations.cannotRerun',
    'pages.evaluations.outdatedItems',
    'pages.evaluations.datasetLabel',
    'pages.evaluations.flowsLabel',
    'pages.evaluations.flowsUsed',
    'pages.evaluations.showCharts',
    'pages.evaluations.charts',
    'pages.evaluations.showCustomEvaluator',
    'pages.evaluations.customEvaluator',
    'pages.evaluations.showCostMetrics',
    'pages.evaluations.costMetrics',
    'pages.evaluations.showTokenMetrics',
    'pages.evaluations.tokenMetrics',
    'pages.evaluations.showLatencyMetrics',
    'pages.evaluations.passRateHeader',
    'pages.evaluations.tokensUsedHeader',
    'pages.evaluations.latencyHeader',
    'pages.evaluations.evaluator',
    'pages.evaluations.llmEvaluation',
    'pages.evaluations.minimize',
    'pages.evaluations.totalCostMetric',
    'pages.evaluations.totalTokensMetric',
    'pages.evaluations.promptTokensMetric',
    'pages.evaluations.completionTokensMetric',
    'pages.evaluations.promptCostMetric',
    'pages.evaluations.completionCostMetric',
    'pages.evaluations.apiLatencyMetric',
    'pages.evaluations.chainLatencyMetric',
    'pages.evaluations.retrieverLatencyMetric',
    'pages.evaluations.toolLatencyMetric',
    'pages.evaluations.llmLatencyMetric',
    'auth.forbidden',
    'auth.noPagePermission',
    'auth.backToHome',
    'auth.setupAccount',
    'auth.accountSetupLocalNotice',
    'auth.organization',
    'auth.organizationName',
    'auth.accountAdministrator',
    'auth.administratorName',
    'auth.administratorEmail',
    'auth.confirmPasswordHint',
    'auth.or',
    'auth.signUpWithMicrosoft',
    'auth.signUpWithGoogle',
    'auth.signUpWithAuth0',
    'auth.validation.nameRequired',
    'auth.validation.emailRequired',
    'auth.validation.invalidEmail',
    'auth.validation.confirmPasswordRequired',
    'auth.validation.passwordsDontMatch',
    'auth.registerOrganizationFailed',
    'auth.registerAccountFailed',
    'auth.errors.singleOrganizationOnly',
    'pages.loginActivity.from',
    'pages.loginActivity.to',
    'pages.loginActivity.filterBy',
    'pages.loginActivity.showingRecords',
    'pages.loginActivity.activity',
    'pages.loginActivity.method',
    'pages.loginActivity.message',
    'pages.loginActivity.emailPassword',
    'pages.loginActivity.loginSuccess',
    'pages.loginActivity.logoutSuccess',
    'pages.loginActivity.unknownUser',
    'pages.loginActivity.incorrectCredential',
    'pages.loginActivity.userDisabled',
    'pages.loginActivity.noAssignedWorkspace',
    'pages.loginActivity.unknownActivity',
    'pages.ssoConfig.enableSsoLogin',
    'pages.ssoConfig.copyCallbackUrl',
    'pages.ssoConfig.tenantId',
    'pages.ssoConfig.clientId',
    'pages.ssoConfig.clientSecret',
    'pages.ssoConfig.auth0Domain',
    'pages.ssoConfig.tenantRequired',
    'pages.ssoConfig.clientIdRequired',
    'pages.ssoConfig.clientSecretRequired',
    'pages.ssoConfig.domainRequired',
    'pages.ssoConfig.updated',
    'pages.ssoConfig.updateFailed',
    'pages.ssoConfig.valid',
    'pages.ssoConfig.verifyFailed',
    'pages.ssoConfig.testConfiguration',
    'pages.roles.addRole',
    'pages.roles.noRoles',
    'pages.roles.assignedUsers',
    'pages.roles.deleteDisabledTooltip',
    'pages.users.inviteUser',
    'pages.users.sendInvite',
    'pages.users.updateInvite',
    'pages.users.save',
    'pages.users.deleteTitle',
    'pages.users.deleteConfirm',
    'pages.users.removed',
    'pages.users.deleteFailed',
    'pages.users.noUsers',
    'pages.users.emailName',
    'pages.users.assignedRoles',
    'pages.users.status',
    'pages.users.lastLogin',
    'pages.users.never',
    'pages.users.organizationOwner',
    'pages.users.role',
    'pages.users.editUser',
    'pages.users.accountStatus',
    'pages.users.cannotChangeOrgOwnerStatus',
    'pages.users.updated',
    'pages.users.updateFailed',
    'pages.users.statusActive',
    'pages.users.statusInactive',
    'pages.users.statusInvited',
    'pages.files.noFiles',
    'pages.files.deleteTitle',
    'pages.files.deleteConfirm',
    'pages.files.deleted',
    'pages.logs.noLogs',
    'pages.logs.lastHour',
    'pages.logs.last4Hours',
    'pages.logs.last24Hours',
    'pages.logs.last2Days',
    'pages.logs.last7Days',
    'pages.logs.last14Days',
    'pages.logs.last1Month',
    'pages.logs.last2Months',
    'pages.logs.last3Months',
    'pages.logs.custom',
    'pages.documentStores.refreshDocumentStore',
    'pages.documentStores.reprocessAllChunks',
    'pages.documentStores.noDocumentsYet',
    'pages.documentStores.pendingProcessingRefresh',
    'pages.documentStores.noSource',
    'pages.documentStores.upsertApiNote',
    'pages.documentStores.overrideExistingConfigurations',
    'pages.documentStores.recordManagerWarning',
    'pages.documentStores.previewChunks',
    'pages.documentStores.previewChunkCount',
    'pages.documentStores.showChunksInPreview',
    'pages.documentStores.editChunk',
    'pages.documentStores.noUpsertHistory',
    'pages.documentStores.upsertVectorDatabase',
    'common.learnMore',
    'pages.tools.mcp.toolNameRequired',
    'pages.tools.mcp.toolNameMax',
    'pages.tools.mcp.toolNamePattern',
    'pages.tools.mcp.settingsSaved',
    'pages.tools.mcp.disabled',
    'pages.tools.mcp.saveSettingsFailed',
    'pages.tools.mcp.urlCopied',
    'pages.tools.mcp.rotateTokenTitle',
    'pages.tools.mcp.rotateTokenDescription',
    'pages.tools.mcp.rotate',
    'pages.tools.mcp.tokenRotated',
    'pages.tools.mcp.rotateTokenFailed',
    'pages.tools.mcp.loadConfigFailed',
    'pages.tools.mcp.loadingConfig',
    'pages.tools.mcp.exposeAsServer',
    'pages.tools.mcp.toolIdentifierHelp',
    'pages.tools.mcp.descriptionPlaceholder',
    'pages.tools.mcp.descriptionHelp',
    'pages.tools.mcp.streamableHttpEndpoint',
    'pages.tools.mcp.copyUrlToClipboard',
    'pages.tools.mcp.endpointHelp',
    'pages.tools.mcp.bearerToken',
    'pages.tools.mcp.tokenCopied',
    'pages.tools.mcp.copyToken',
    'pages.tools.mcp.rotateToken',
    'pages.tools.mcp.authorizationHeaderHelp',
    'pages.tools.mcp.saving',
    'pages.tools.mcp.serverUrlRequired',
    'pages.tools.mcp.maskedUrlError',
    'pages.tools.mcp.onlyHttpUrls',
    'pages.tools.mcp.validUrl',
    'pages.tools.mcp.readOnly',
    'pages.tools.mcp.readOnlyTooltip',
    'pages.tools.mcp.destructive',
    'pages.tools.mcp.destructiveTooltip',
    'pages.tools.mcp.external',
    'pages.tools.mcp.externalTooltip',
    'pages.tools.mcp.parameterCount',
    'pages.tools.mcp.parameters',
    'pages.tools.mcp.required',
    'pages.tools.mcp.optional',
    'pages.tools.mcp.defaultValue',
    'pages.tools.mcp.createReturnedNoId',
    'pages.tools.mcp.failedAddServer',
    'pages.tools.mcp.serverAddedConnected',
    'pages.tools.mcp.addedFailedConnect',
    'pages.tools.mcp.redactedHeaderValue',
    'pages.tools.mcp.failedSaveServer',
    'pages.tools.mcp.savedReconnected',
    'pages.tools.mcp.savedFailedReconnect',
    'pages.tools.mcp.connectedTools',
    'pages.tools.mcp.authorizationFailed',
    'pages.tools.mcp.deleteTitle',
    'pages.tools.mcp.deleteConfirm',
    'pages.tools.mcp.deleted',
    'pages.tools.mcp.failedDelete',
    'pages.tools.mcp.customMcpServer',
    'pages.tools.mcp.serverName',
    'pages.tools.mcp.serverUrl',
    'pages.tools.mcp.iconSource',
    'pages.tools.mcp.authentication',
    'pages.tools.mcp.noAuthentication',
    'pages.tools.mcp.customHeaders',
    'pages.tools.mcp.headers',
    'pages.tools.mcp.headerKey',
    'pages.tools.mcp.headerValue',
    'pages.tools.mcp.addHeader',
    'pages.tools.mcp.discoveredTools',
    'pages.tools.mcp.filterTools',
    'pages.tools.mcp.filteredToolsCount',
    'pages.tools.mcp.toolsCount',
    'pages.tools.mcp.collapseAll',
    'pages.tools.mcp.expandAll',
    'pages.tools.mcp.noToolsMatch',
    'pages.tools.mcp.connecting',
    'pages.tools.mcp.authorize',
    'pages.tools.mcp.addConnect',
    'pages.tools.mcp.reconnecting',
    'pages.tools.mcp.saveReconnect',
    'pages.tools.mcp.serverNameTooltip',
    'pages.tools.mcp.serverUrlTooltip',
    'pages.tools.mcp.authTooltip',
    'pages.roles.editRole',
    'pages.roles.viewRole',
    'pages.roles.createNewRole',
    'pages.roles.roleName',
    'pages.roles.roleNameNoSpaces',
    'pages.roles.roleNamePlaceholder',
    'pages.roles.roleDescription',
    'pages.roles.roleDescriptionPlaceholder',
    'canvas.chatConfig.providers',
    'canvas.chatConfig.connectCredential',
    'canvas.chatConfig.language',
    'canvas.chatConfig.languageDescription',
    'canvas.chatConfig.prompt',
    'canvas.chatConfig.sttPromptDescription',
    'canvas.chatConfig.temperature',
    'canvas.chatConfig.temperatureDescription',
    'canvas.chatConfig.baseUrl',
    'canvas.chatConfig.localAiBaseUrlDescription',
    'canvas.chatConfig.model',
    'canvas.chatConfig.sttModelDescription',
    'canvas.chatConfig.groqSttModelDescription',
    'canvas.chatConfig.recognitionLanguageDescription',
    'canvas.chatConfig.profanityFilterMode',
    'canvas.chatConfig.profanityFilterModeDescription',
    'canvas.chatConfig.profanityNone',
    'canvas.chatConfig.profanityMasked',
    'canvas.chatConfig.profanityRemoved',
    'canvas.chatConfig.audioChannels',
    'canvas.chatConfig.audioChannelsDescription',
    'canvas.chatConfig.voice',
    'canvas.chatConfig.ttsVoiceDescription',
    'canvas.chatConfig.elevenLabsVoiceDescription',
    'canvas.chatConfig.modelName',
    'canvas.chatConfig.followUpPromptDescription',
    'canvas.chatConfig.followUpDefaultPrompt',
    'canvas.chatConfig.ollamaBaseUrlDescription',
    'canvas.chatConfig.ollamaModelNameDescription',
    'canvas.chatConfig.speechToTextSaved',
    'canvas.chatConfig.speechToTextSaveFailed',
    'canvas.chatConfig.textToSpeechSaved',
    'canvas.chatConfig.textToSpeechSaveFailed',
    'canvas.chatConfig.selectProviderCredentialsFirst',
    'canvas.chatConfig.loadingVoices',
    'canvas.chatConfig.chooseVoice',
    'canvas.chatConfig.automaticallyPlayAudio',
    'canvas.chatConfig.autoPlayHelp',
    'canvas.chatConfig.testVoice',
    'canvas.chatConfig.ttsTestText',
    'canvas.chatConfig.ttsTestFailed',
    'canvas.chatConfig.noAudioDataReceived',
    'canvas.chatConfig.followUpPromptsSaved',
    'canvas.chatConfig.followUpPromptsSaveFailed',
    'canvas.chatConfig.enableFollowUpPrompts',
    'canvas.chatConfig.chatFeedbackSaved',
    'canvas.chatConfig.chatFeedbackSaveFailed',
    'canvas.chatConfig.enableChatFeedback',
    'canvas.chatConfig.allowedOriginsSaved',
    'canvas.chatConfig.allowedOriginsSaveFailed',
    'canvas.chatConfig.allowedDomainsHelp',
    'canvas.chatConfig.domains',
    'canvas.chatConfig.errorMessage',
    'canvas.chatConfig.unauthorizedDomainErrorHelp',
    'canvas.chatConfig.unauthorizedDomainMessage',
    'canvas.chatConfig.leadsSaved',
    'canvas.chatConfig.leadsSaveFailed',
    'canvas.chatConfig.enableLeadCapture',
    'canvas.chatConfig.formTitle',
    'canvas.chatConfig.formTitlePlaceholder',
    'canvas.chatConfig.leadSuccessMessage',
    'canvas.chatConfig.leadSuccessMessagePlaceholder',
    'canvas.chatConfig.formFields',
    'canvas.chatConfig.fileUploadSaved',
    'canvas.chatConfig.fileUploadSaveFailed',
    'canvas.chatConfig.fileUploadNotice',
    'canvas.chatConfig.enableFullFileUpload',
    'canvas.chatConfig.allowUploadsOfType',
    'canvas.chatConfig.advancedSettings',
    'canvas.chatConfig.pdfProcessing',
    'canvas.chatConfig.oneDocumentPerPage',
    'canvas.chatConfig.oneDocumentPerFile',
    'canvas.chatConfig.fileTypeText',
    'canvas.chatConfig.rateLimitSaved',
    'canvas.chatConfig.rateLimitSaveFailed',
    'canvas.chatConfig.rateLimitInputRequired',
    'canvas.chatConfig.rateLimitHelp',
    'canvas.chatConfig.enableRateLimit',
    'canvas.chatConfig.messageLimitPerDuration',
    'canvas.chatConfig.durationInSeconds',
    'canvas.chatConfig.limitMessage',
    'canvas.chatConfig.limitMessagePlaceholder',
    'canvas.chatConfig.postProcessingSaved',
    'canvas.chatConfig.postProcessingSaveFailed',
    'canvas.chatConfig.postProcessingFunction',
    'canvas.chatConfig.enablePostProcessing',
    'canvas.chatConfig.jsFunction',
    'canvas.chatConfig.availableVariables',
    'canvas.chatConfig.variable',
    'canvas.chatConfig.rawOutputDescription',
    'canvas.chatConfig.inputDescription',
    'canvas.chatConfig.chatHistoryDescription',
    'canvas.chatConfig.chatflowIdDescription',
    'canvas.chatConfig.sessionIdDescription',
    'canvas.chatConfig.chatIdDescription',
    'canvas.chatConfig.sourceDocumentsDescription',
    'canvas.chatConfig.usedToolsDescription',
    'canvas.chatConfig.artifactsDescription',
    'canvas.chatConfig.fileAnnotationsDescription',
    'canvas.chatConfig.starterPromptsSaved',
    'canvas.chatConfig.starterPromptsSaveFailed',
    'canvas.chatConfig.starterPromptsHint',
    'canvas.chatConfig.overrideSaved',
    'canvas.chatConfig.overrideSaveFailed',
    'canvas.chatConfig.overrideConfiguration',
    'canvas.chatConfig.overrideHelp',
    'canvas.chatConfig.enableOverrideConfiguration',
    'canvas.chatConfig.schema',
    'canvas.chatConfig.noSchemaAvailable',
    'canvas.chatConfig.label',
    'canvas.chatConfig.on',
    'pages.executions.copyId',
    'pages.executions.copied',
    'pages.executions.idCopied',
    'pages.executions.executionId',
    'pages.executions.goToAgentflow',
    'pages.executions.updating',
    'pages.executions.share',
    'pages.executions.public',
    'pages.executions.refreshExecutionData',
    'pages.executions.noItemData',
    'pages.executions.resizeDrawer',
    'pages.executions.sharedPublicly',
    'pages.executions.noLongerPublic',
    'pages.executions.publicTraceLink',
    'pages.executions.publicTraceDescription',
    'pages.executions.copyLink',
    'pages.executions.linkCopied',
    'pages.executions.unshare',
    'pages.executions.invalidExecution',
    'pages.executions.invalidExecutionDescription',
    'pages.executions.deleteSelectedExecutions',
    'pages.executions.selectAllExecutions',
    'pages.executions.executionsTable',
    'pages.executions.deleteConfirmTitle',
    'pages.executions.deleteConfirmDescription',
    'pages.executions.rendered',
    'pages.executions.raw',
    'pages.executions.seconds',
    'pages.executions.tokens',
    'pages.executions.toolCall',
    'pages.executions.used',
    'pages.executions.called',
    'pages.executions.showLess',
    'pages.executions.showMore',
    'pages.executions.input',
    'pages.executions.noData',
    'pages.executions.noErrorDetails',
    'pages.executions.reject',
    'pages.executions.proceed',
    'pages.executions.submittingFeedback',
    'pages.executions.responseSubmitted',
    'pages.executions.responseSubmitFailed',
    'pages.executions.elseConditionFulfilled',
    'pages.executions.fulfilled',
    'pages.executions.notFulfilled',
    'pages.executions.condition',
    'pages.executions.usedTools',
    'pages.executions.iterationLabel'
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

    it('localizes evaluation result page and full-screen result dialog visible copy', () => {
        const resultSource = read('views/evaluations/EvaluationResult.jsx')
        const resultDialogSource = read('views/evaluations/EvalsResultDialog.jsx')

        expect(resultSource).toContain('const { t, i18n } = useTranslation()')
        expect(resultSource).toContain('formatEvaluationDate')
        expect(resultSource).toContain("title={t('pages.evaluations.evaluationTitle'")
        expect(resultSource).toContain('description={formatEvaluationDate(evaluation?.runDate, i18n)}')
        expect(resultSource).toContain("confirmButtonName: t('common.yes')")
        expect(resultSource).toContain("cancelButtonName: t('common.no')")
        expect(resultSource).toContain("message: t('pages.evaluations.evaluationRunningRedirect'")
        expect(resultSource).toContain("label={t('pages.evaluations.versionLabel'")
        expect(resultSource).toContain("t('pages.evaluations.versionHistory')")
        expect(resultSource).toContain("t('pages.evaluations.reRunEvaluation')")
        expect(resultSource).toContain("t('pages.evaluations.cannotRerun')")
        expect(resultSource).toContain("t('pages.evaluations.outdatedItems')")
        expect(resultSource).toContain("t('pages.evaluations.datasetLabel')")
        expect(resultSource).toContain("t('pages.evaluations.flowsLabel')")
        expect(resultSource).toContain("t('pages.evaluations.flowsUsed')")
        expect(resultSource).toContain("title={t('pages.evaluations.showCharts')}")
        expect(resultSource).toContain("t('pages.evaluations.charts')")
        expect(resultSource).toContain("title={t('pages.evaluations.showCustomEvaluator')}")
        expect(resultSource).toContain("t('pages.evaluations.customEvaluator')")
        expect(resultSource).toContain("title={t('pages.evaluations.showCostMetrics')}")
        expect(resultSource).toContain("t('pages.evaluations.costMetrics')")
        expect(resultSource).toContain("title={t('pages.evaluations.showTokenMetrics')}")
        expect(resultSource).toContain("t('pages.evaluations.tokenMetrics')")
        expect(resultSource).toContain("title={t('pages.evaluations.showLatencyMetrics')}")
        expect(resultSource).toContain("t('pages.evaluations.passRateHeader')")
        expect(resultSource).toContain("t('pages.evaluations.tokensUsedHeader')")
        expect(resultSource).toContain("t('pages.evaluations.latencyHeader')")
        expect(resultSource).toContain("t('pages.evaluations.input')")
        expect(resultSource).toContain("t('pages.evaluations.expectedOutput')")
        expect(resultSource).toContain("t('pages.evaluations.actualOutput')")
        expect(resultSource).toContain("t('pages.evaluations.evaluator')")
        expect(resultSource).toContain("t('pages.evaluations.llmEvaluation')")
        expect(resultSource).toContain('getEvaluationMetricLabel')
        expect(resultSource).toContain('getEvaluationResultLabel')
        expect(resultSource).toContain("'pages.evaluations.totalCostMetric'")
        expect(resultSource).toContain("'pages.evaluations.llmLatencyMetric'")
        expect(resultSource).not.toContain('Run Again')
        expect(resultSource).not.toContain('Initiate Rerun for Evaluation')
        expect(resultSource).not.toContain('Redirecting to evaluations page')
        expect(resultSource).not.toContain('Evaluation: ')
        expect(resultSource).not.toContain("format('DD-MMM-YYYY, hh:mm:ss A')")
        expect(resultSource).not.toContain('Version: ')
        expect(resultSource).not.toContain('Version history')
        expect(resultSource).not.toContain('Re-run Evaluation')
        expect(resultSource).not.toContain('This evaluation cannot be re-run')
        expect(resultSource).not.toContain('The following items are outdated')
        expect(resultSource).not.toContain('Dataset:')
        expect(resultSource).not.toContain('Flows:')
        expect(resultSource).not.toContain('Flows Used:')
        expect(resultSource).not.toContain('Show Charts')
        expect(resultSource).not.toContain('Show Custom Evaluator')
        expect(resultSource).not.toContain('Show Cost Metrics')
        expect(resultSource).not.toContain('Show Metrics')
        expect(resultSource).not.toContain('Show Latency Metrics')
        expect(resultSource).not.toContain('PASS RATE')
        expect(resultSource).not.toContain('TOKENS USED')
        expect(resultSource).not.toContain('LATENCY (ms)')
        expect(resultSource).not.toContain("<TableCell rowSpan='2'>Input</TableCell>")
        expect(resultSource).not.toContain("<TableCell rowSpan='2'>Expected Output</TableCell>")
        expect(resultSource).not.toContain('Total Cost:')
        expect(resultSource).not.toContain('Total Tokens:')
        expect(resultSource).not.toContain('API Latency:')

        expect(resultDialogSource).toContain('const { t } = useTranslation()')
        expect(resultDialogSource).toContain("t('pages.evaluations.flowsUsed')")
        expect(resultDialogSource).toContain("t('pages.evaluations.minimize')")
        expect(resultDialogSource).toContain("t('pages.evaluations.input')")
        expect(resultDialogSource).toContain("t('pages.evaluations.expectedOutput')")
        expect(resultDialogSource).toContain("t('pages.evaluations.actualOutput')")
        expect(resultDialogSource).toContain("t('pages.evaluations.evaluator')")
        expect(resultDialogSource).toContain("t('pages.evaluations.llmEvaluation')")
        expect(resultDialogSource).toContain('getEvaluationMetricLabel')
        expect(resultDialogSource).toContain('getEvaluationResultLabel')
        expect(resultDialogSource).toContain("'pages.evaluations.totalCostMetric'")
        expect(resultDialogSource).toContain("'pages.evaluations.llmLatencyMetric'")
        expect(resultDialogSource).not.toContain('Flows Used:')
        expect(resultDialogSource).not.toContain('>Minimize<')
        expect(resultDialogSource).not.toContain("<TableCell rowSpan='2'>Input</TableCell>")
        expect(resultDialogSource).not.toContain("<TableCell rowSpan='2'>Expected Output</TableCell>")
        expect(resultDialogSource).not.toContain('Total Cost:')
        expect(resultDialogSource).not.toContain('Total Tokens:')
        expect(resultDialogSource).not.toContain('API Latency:')
    })

    it('localizes B6 admin residual pages: auth, users, roles, files, logs, and SSO', () => {
        const unauthorizedSource = read('views/auth/unauthorized.jsx')
        const loginActivitySource = read('views/auth/loginActivity.jsx')
        const ssoSource = read('views/auth/ssoConfig.jsx')
        const organizationSource = read('views/organization/index.jsx')
        const usersSource = read('views/users/index.jsx')
        const editUserSource = read('views/users/EditUserDialog.jsx')
        const rolesSource = read('views/roles/index.jsx')
        const filesSource = read('views/files/index.jsx')
        const logsSource = read('views/serverlogs/index.jsx')

        expect(unauthorizedSource).toContain("t('auth.forbidden')")
        expect(unauthorizedSource).toContain("t('auth.noPagePermission')")
        expect(unauthorizedSource).toContain("t('auth.backToHome')")
        expect(unauthorizedSource).not.toContain('403 Forbidden')
        expect(unauthorizedSource).not.toContain('You do not have permission to access this page.')
        expect(unauthorizedSource).not.toContain('Back to Home')

        expect(loginActivitySource).toContain('activityTypes')
        expect(loginActivitySource).toContain('getActivityDescription(t, item.activityCode)')
        expect(loginActivitySource).toContain("t('pages.loginActivity.from')")
        expect(loginActivitySource).toContain("t('pages.loginActivity.to')")
        expect(loginActivitySource).toContain("t('pages.loginActivity.filterBy')")
        expect(loginActivitySource).toContain("t('pages.loginActivity.showingRecords'")
        expect(loginActivitySource).toContain("t('pages.loginActivity.activity')")
        expect(loginActivitySource).toContain("t('pages.loginActivity.method')")
        expect(loginActivitySource).toContain("t('pages.loginActivity.message')")
        expect(loginActivitySource).toContain("t('pages.loginActivity.emailPassword')")
        expect(loginActivitySource).not.toContain('Login Success')
        expect(loginActivitySource).not.toContain('Filter By')
        expect(loginActivitySource).not.toContain('Showing {Math.min')
        expect(loginActivitySource).not.toContain('<StyledTableCell>Activity</StyledTableCell>')
        expect(loginActivitySource).not.toContain('Email/Password')

        expect(ssoSource).toContain("t('pages.ssoConfig.enableSsoLogin')")
        expect(ssoSource).toContain("t('pages.ssoConfig.copyCallbackUrl')")
        expect(ssoSource).toContain("t('pages.ssoConfig.tenantId')")
        expect(ssoSource).toContain("t('pages.ssoConfig.clientId')")
        expect(ssoSource).toContain("t('pages.ssoConfig.clientSecret')")
        expect(ssoSource).toContain("t('pages.ssoConfig.auth0Domain')")
        expect(ssoSource).toContain("t('pages.ssoConfig.tenantRequired'")
        expect(ssoSource).toContain("t('pages.ssoConfig.clientIdRequired'")
        expect(ssoSource).toContain("t('pages.ssoConfig.clientSecretRequired'")
        expect(ssoSource).toContain("t('pages.ssoConfig.domainRequired'")
        expect(ssoSource).toContain("message: t('pages.ssoConfig.updated')")
        expect(ssoSource).toContain("message: t('pages.ssoConfig.updateFailed')")
        expect(ssoSource).toContain("message: t('pages.ssoConfig.valid'")
        expect(ssoSource).toContain("message: t('pages.ssoConfig.verifyFailed'")
        expect(ssoSource).toContain("t('pages.ssoConfig.testConfiguration'")
        expect(ssoSource).not.toContain('Enable SSO Login')
        expect(ssoSource).not.toContain('Copy Callback URL')
        expect(ssoSource).not.toContain('cannot be left blank')
        expect(ssoSource).not.toContain('SSO Configuration Updated!')
        expect(ssoSource).not.toContain('Failed to update SSO Configuration.')
        expect(ssoSource).not.toContain('SSO Configuration is Valid!')
        expect(ssoSource).not.toContain('Failed to verify')
        expect(ssoSource).not.toContain("'Test ' + getSelectedProviderName() + ' Configuration'")

        expect(organizationSource).toContain("t('auth.setupAccount')")
        expect(organizationSource).toContain("t('auth.accountSetupLocalNotice')")
        expect(organizationSource).toContain("t('auth.organization')")
        expect(organizationSource).toContain("t('auth.organizationName')")
        expect(organizationSource).toContain("t('auth.accountAdministrator')")
        expect(organizationSource).toContain("t('auth.administratorName')")
        expect(organizationSource).toContain("t('auth.administratorEmail')")
        expect(organizationSource).toContain("t('auth.confirmPasswordHint')")
        expect(organizationSource).toContain("t('auth.or')")
        expect(organizationSource).toContain("t('auth.signUpWithMicrosoft')")
        expect(organizationSource).toContain("t('auth.signUpWithGoogle')")
        expect(organizationSource).toContain("t('auth.signUpWithAuth0')")
        expect(organizationSource).not.toContain('Setup Account')
        expect(organizationSource).not.toContain('Account setup does not make any external connections')
        expect(organizationSource).not.toContain('Organization Name:')
        expect(organizationSource).not.toContain('Account Administrator')
        expect(organizationSource).not.toContain('Reconfirm your password')
        expect(organizationSource).not.toContain('Sign Up With Microsoft')

        const signInSource = read('views/auth/signIn.jsx')
        expect(signInSource).toContain('isOpenSource &&')
        expect(signInSource).toContain("to='/organization-setup'")
        expect(signInSource).toContain("t('auth.createAccount')")

        expect(usersSource).toContain("t('pages.users.inviteUser')")
        expect(usersSource).toContain("cancelButtonName: t('common.cancel')")
        expect(usersSource).toContain("confirmButtonName: t('pages.users.sendInvite')")
        expect(usersSource).toContain("confirmButtonName: t('pages.users.updateInvite')")
        expect(usersSource).toContain("confirmButtonName: t('pages.users.save')")
        expect(usersSource).toContain("t('pages.users.deleteConfirm'")
        expect(usersSource).toContain("message: t('pages.users.removed')")
        expect(usersSource).toContain("t('pages.users.deleteFailed'")
        expect(usersSource).toContain("t('pages.users.noUsers')")
        expect(usersSource).toContain("t('pages.users.emailName')")
        expect(usersSource).toContain("t('pages.users.assignedRoles')")
        expect(usersSource).toContain("t('pages.users.status')")
        expect(usersSource).toContain("t('pages.users.lastLogin')")
        expect(usersSource).toContain("t('pages.users.never')")
        expect(usersSource).toContain("t('pages.users.organizationOwner')")
        expect(usersSource).toContain("t('pages.users.role')")
        expect(usersSource).toContain('getUserStatusLabel')
        expect(usersSource).not.toContain('Invite User')
        expect(usersSource).not.toContain('Send Invite')
        expect(usersSource).not.toContain('Update Invite')
        expect(usersSource).not.toContain('Remove ${user.name')
        expect(usersSource).not.toContain('User removed from organization successfully')
        expect(usersSource).not.toContain('No Users Yet')
        expect(usersSource).not.toContain('ORGANIZATION OWNER')
        expect(usersSource).not.toContain('Assigned Roles')
        expect(usersSource).not.toContain('Email/Name')
        expect(usersSource).not.toContain('Last Login')
        expect(usersSource).not.toContain('Never')

        expect(editUserSource).toContain('getStatusOptions(t)')
        expect(editUserSource).toContain("message: t('pages.users.updated')")
        expect(editUserSource).toContain("t('pages.users.updateFailed'")
        expect(editUserSource).toContain("t('pages.users.editUser')")
        expect(editUserSource).toContain("t('pages.users.accountStatus')")
        expect(editUserSource).toContain("t('pages.users.cannotChangeOrgOwnerStatus')")
        expect(editUserSource).not.toContain('User Details Updated')
        expect(editUserSource).not.toContain('Edit User')
        expect(editUserSource).not.toContain('Account Status')
        expect(editUserSource).not.toContain('Cannot change status of the organization owner!')

        expect(rolesSource).toContain("t('pages.roles.addRole')")
        expect(rolesSource).toContain("t('pages.roles.noRoles')")
        expect(rolesSource).toContain("t('pages.roles.assignedUsers')")
        expect(rolesSource).toContain("t('pages.roles.deleteDisabledTooltip')")
        expect(rolesSource).not.toContain('Add Role')
        expect(rolesSource).not.toContain('No Roles Yet')
        expect(rolesSource).not.toContain('Assigned Users')
        expect(rolesSource).not.toContain('Remove users with the role from Workspace first')

        expect(filesSource).toContain("t('pages.files.deleteTitle')")
        expect(filesSource).toContain("t('pages.files.deleteConfirm'")
        expect(filesSource).toContain("message: t('pages.files.deleted')")
        expect(filesSource).toContain("t('pages.files.noFiles')")
        expect(filesSource).not.toContain('No Files Yet')
        expect(filesSource).not.toContain('File deleted')
        expect(filesSource).not.toContain('This process cannot be undone.')

        expect(logsSource).toContain('getSearchTimeRangeLabel')
        expect(logsSource).toContain("t('pages.logs.noLogs')")
        expect(logsSource).toContain("t('canvas.dialogs.toDate')")
        expect(logsSource).not.toContain('Last hour')
        expect(logsSource).not.toContain('No Logs Yet')
        expect(logsSource).not.toContain('<b>To</b>')
    })

    it('localizes B6 document store residual buttons, notes, and empty states', () => {
        const detailSource = read('views/docstore/DocumentStoreDetail.jsx')
        const apiDialogSource = read('views/docstore/DocStoreAPIDialog.jsx')
        const deleteDialogSource = read('views/docstore/DeleteDocStoreDialog.jsx')
        const previewChunksSource = read('views/docstore/LoaderConfigPreviewChunks.jsx')
        const expandedChunkSource = read('views/docstore/ExpandedChunkDialog.jsx')
        const upsertHistorySource = read('views/docstore/UpsertHistorySideDrawer.jsx')
        const componentsListSource = read('views/docstore/ComponentsListDialog.jsx')
        const loaderListSource = read('views/docstore/DocumentLoaderListDialog.jsx')
        const vectorStorePopUpSource = read('views/vectorstore/VectorStorePopUp.jsx')

        expect(detailSource).toContain("title={t('pages.documentStores.refreshDocumentStore')}")
        expect(detailSource).toContain("title={t('pages.documentStores.reprocessAllChunks')}")
        expect(detailSource).toContain("t('pages.documentStores.noDocumentsYet')")
        expect(detailSource).toContain("t('pages.documentStores.pendingProcessingRefresh')")
        expect(detailSource).toContain("t('pages.documentStores.noSource')")
        expect(detailSource).not.toContain('Refresh Document Store')
        expect(detailSource).not.toContain('Re-process all loaders and upsert all chunks')
        expect(detailSource).not.toContain('No Document Added Yet')
        expect(detailSource).not.toContain('Some files are pending processing')
        expect(detailSource).not.toContain('No source')

        expect(apiDialogSource).toContain("t('pages.documentStores.upsertApiNote')")
        expect(apiDialogSource).toContain("t('pages.documentStores.overrideExistingConfigurations')")
        expect(apiDialogSource).not.toContain('Upsert API can only be used')
        expect(apiDialogSource).not.toContain('You can override existing configurations:')

        expect(deleteDialogSource).toContain("t('pages.documentStores.recordManagerWarning')")
        expect(deleteDialogSource).toContain("t('common.learnMore')")
        expect(deleteDialogSource).not.toContain('Without a Record Manager configured')
        expect(deleteDialogSource).not.toContain('Learn more')

        expect(previewChunksSource).toContain("t('pages.documentStores.previewChunks')")
        expect(previewChunksSource).toContain("t('pages.documentStores.previewChunkCount'")
        expect(previewChunksSource).toContain("t('pages.documentStores.showChunksInPreview')")
        expect(previewChunksSource).not.toContain('Preview Chunks')
        expect(previewChunksSource).not.toContain('Show Chunks in Preview')

        expect(expandedChunkSource).toContain("title={t('pages.documentStores.editChunk')}")
        expect(expandedChunkSource).toContain("title={t('pages.documentStores.deleteChunkTitle')}")
        expect(expandedChunkSource).not.toContain('Edit Chunk')
        expect(expandedChunkSource).not.toContain('Delete Chunk')

        expect(upsertHistorySource).toContain("t('pages.documentStores.noUpsertHistory')")
        expect(upsertHistorySource).not.toContain('No Upsert History Yet')

        expect(componentsListSource).toContain("title={t('common.clearSearch')}")
        expect(loaderListSource).toContain("title={t('common.clearSearch')}")
        expect(componentsListSource).not.toContain('Clear Search')
        expect(loaderListSource).not.toContain('Clear Search')

        expect(vectorStorePopUpSource).toContain("title={t('pages.documentStores.upsertVectorDatabase')}")
        expect(vectorStorePopUpSource).not.toContain('Upsert Vector Database')
    })

    it('localizes B6 MCP dialogs and role editor residual visible copy', () => {
        const mcpServerSource = read('ui-component/extended/McpServer.jsx')
        const customMcpSource = read('views/tools/CustomMcpServerDialog.jsx')
        const roleDialogSource = read('views/roles/CreateEditRoleDialog.jsx')

        expect(mcpServerSource).toContain("t('pages.tools.mcp.toolNameRequired')")
        expect(mcpServerSource).toContain("showSuccess(t('pages.tools.mcp.settingsSaved'))")
        expect(mcpServerSource).toContain("t('pages.tools.mcp.rotateTokenTitle')")
        expect(mcpServerSource).toContain("t('pages.tools.mcp.loadingConfig')")
        expect(mcpServerSource).toContain("label={t('pages.tools.mcp.exposeAsServer')}")
        expect(mcpServerSource).toContain("t('pages.tools.mcp.toolIdentifierHelp')")
        expect(mcpServerSource).toContain("placeholder={t('pages.tools.mcp.descriptionPlaceholder')}")
        expect(mcpServerSource).toContain("t('pages.tools.mcp.streamableHttpEndpoint')")
        expect(mcpServerSource).toContain("title={t('pages.tools.mcp.copyUrlToClipboard')}")
        expect(mcpServerSource).toContain("t('pages.tools.mcp.authorizationHeaderHelp')")
        expect(mcpServerSource).toContain("loading ? t('pages.tools.mcp.saving') : t('common.save')")
        expect(mcpServerSource).not.toContain('Tool name is required')
        expect(mcpServerSource).not.toContain('MCP Server settings saved')
        expect(mcpServerSource).not.toContain('Expose as MCP Server')
        expect(mcpServerSource).not.toContain('Loading MCP Server configuration...')
        expect(mcpServerSource).not.toContain('Streamable HTTP Endpoint')
        expect(mcpServerSource).not.toContain('Saving...')

        expect(customMcpSource).toContain("label={t('pages.tools.mcp.readOnly')}")
        expect(customMcpSource).toContain("t('pages.tools.mcp.parameterCount'")
        expect(customMcpSource).toContain("t('pages.tools.mcp.parameters')")
        expect(customMcpSource).toContain("t('pages.tools.mcp.required')")
        expect(customMcpSource).toContain("t('pages.tools.mcp.failedAddServer'")
        expect(customMcpSource).toContain("t('pages.tools.mcp.redactedHeaderValue'")
        expect(customMcpSource).toContain("title: t('pages.tools.mcp.deleteTitle')")
        expect(customMcpSource).toContain("t('pages.tools.addCustomMcpServer')")
        expect(customMcpSource).toContain("t('pages.tools.mcp.serverName')")
        expect(customMcpSource).toContain("t('pages.tools.mcp.noAuthentication')")
        expect(customMcpSource).toContain("t('pages.tools.mcp.addHeader')")
        expect(customMcpSource).toContain("t('pages.tools.mcp.discoveredTools')")
        expect(customMcpSource).toContain("t('pages.tools.mcp.filteredToolsCount'")
        expect(customMcpSource).toContain("t('pages.tools.mcp.noToolsMatch'")
        expect(customMcpSource).toContain("authorizing ? t('pages.tools.mcp.connecting') : t('pages.tools.mcp.authorize')")
        expect(customMcpSource).not.toContain('READ-ONLY')
        expect(customMcpSource).not.toContain('Failed to add MCP Server')
        expect(customMcpSource).not.toContain('Delete MCP Server')
        expect(customMcpSource).not.toContain('Add Custom MCP Server')
        expect(customMcpSource).not.toContain('No Authentication')
        expect(customMcpSource).not.toContain('Discovered Tools')
        expect(customMcpSource).not.toContain('Collapse all')
        expect(customMcpSource).not.toContain('Add & Connect')

        expect(roleDialogSource).toContain("t('pages.roles.editRole')")
        expect(roleDialogSource).toContain("t('pages.roles.roleName')")
        expect(roleDialogSource).toContain("placeholder={t('pages.roles.roleNamePlaceholder')}")
        expect(roleDialogSource).toContain("t('pages.roles.roleDescription')")
        expect(roleDialogSource).not.toContain('Edit Role')
        expect(roleDialogSource).not.toContain('Role Name')
        expect(roleDialogSource).not.toContain('Enter role name')
        expect(roleDialogSource).not.toContain('Description of the role')
    })

    it('localizes B6 chat configuration extension panels', () => {
        const speechSource = read('ui-component/extended/SpeechToText.jsx')
        const ttsSource = read('ui-component/extended/TextToSpeech.jsx')
        const followUpSource = read('ui-component/extended/FollowUpPrompts.jsx')
        const feedbackSource = read('ui-component/extended/ChatFeedback.jsx')
        const allowedDomainsSource = read('ui-component/extended/AllowedDomains.jsx')
        const leadsSource = read('ui-component/extended/Leads.jsx')
        const fileUploadSource = read('ui-component/extended/FileUpload.jsx')
        const rateLimitSource = read('ui-component/extended/RateLimit.jsx')
        const postProcessingSource = read('ui-component/extended/PostProcessing.jsx')
        const starterPromptsSource = read('ui-component/extended/StarterPrompts.jsx')
        const overrideSource = read('ui-component/extended/OverrideConfig.jsx')

        expect(speechSource).toContain("message: t('canvas.chatConfig.speechToTextSaved')")
        expect(speechSource).toContain("t('canvas.chatConfig.speechToTextSaveFailed'")
        expect(speechSource).toContain("t('canvas.chatConfig.providers')")
        expect(speechSource).toContain('localizeInputParam')
        expect(speechSource).not.toContain('Speech To Text Configuration Saved')
        expect(speechSource).not.toContain('Failed to save Speech To Text Configuration')
        expect(speechSource).not.toContain('<Typography>Providers</Typography>')
        expect(speechSource).not.toContain("label: 'Connect Credential'")
        expect(speechSource).not.toContain("label: 'Language'")

        expect(ttsSource).toContain("message: t('canvas.chatConfig.textToSpeechSaved')")
        expect(ttsSource).toContain("t('canvas.chatConfig.textToSpeechSaveFailed'")
        expect(ttsSource).toContain("t('canvas.chatConfig.selectProviderCredentialsFirst')")
        expect(ttsSource).toContain("t('canvas.chatConfig.loadingVoices')")
        expect(ttsSource).toContain("t('canvas.chatConfig.automaticallyPlayAudio')")
        expect(ttsSource).toContain("t('canvas.chatConfig.testVoice')")
        expect(ttsSource).not.toContain('Text To Speech Configuration Saved')
        expect(ttsSource).not.toContain('Please select a provider and configure credentials first')
        expect(ttsSource).not.toContain('Automatically play audio')
        expect(ttsSource).not.toContain('Test Voice')
        expect(ttsSource).not.toContain('Loading voices...')

        expect(followUpSource).toContain("message: t('canvas.chatConfig.followUpPromptsSaved')")
        expect(followUpSource).toContain("t('canvas.chatConfig.enableFollowUpPrompts')")
        expect(followUpSource).toContain("t('canvas.chatConfig.followUpDefaultPrompt')")
        expect(followUpSource).not.toContain('Follow-up Prompts configuration saved')
        expect(followUpSource).not.toContain('Enable Follow-up Prompts')
        expect(followUpSource).not.toContain('Prompt to generate questions based on the conversation history')

        expect(feedbackSource).toContain("message: t('canvas.chatConfig.chatFeedbackSaved')")
        expect(feedbackSource).toContain("label={t('canvas.chatConfig.enableChatFeedback')}")
        expect(feedbackSource).not.toContain('Chat Feedback Settings Saved')
        expect(feedbackSource).not.toContain('Enable chat feedback')

        expect(allowedDomainsSource).toContain("message: t('canvas.chatConfig.allowedOriginsSaved')")
        expect(allowedDomainsSource).toContain("t('canvas.chatConfig.allowedDomainsHelp')")
        expect(allowedDomainsSource).toContain("t('canvas.chatConfig.unauthorizedDomainMessage')")
        expect(allowedDomainsSource).not.toContain('Allowed Origins Saved')
        expect(allowedDomainsSource).not.toContain('Your chatbot will only work when used from the following domains.')
        expect(allowedDomainsSource).not.toContain('Unauthorized domain!')

        expect(leadsSource).toContain("message: t('canvas.chatConfig.leadsSaved')")
        expect(leadsSource).toContain("label={t('canvas.chatConfig.enableLeadCapture')}")
        expect(leadsSource).toContain("placeholder={t('canvas.chatConfig.formTitlePlaceholder')}")
        expect(leadsSource).not.toContain('Leads configuration Saved')
        expect(leadsSource).not.toContain('Enable Lead Capture')
        expect(leadsSource).not.toContain('Message after lead captured')

        expect(fileUploadSource).toContain("message: t('canvas.chatConfig.fileUploadSaved')")
        expect(fileUploadSource).toContain("parser(t('canvas.chatConfig.fileUploadNotice'))")
        expect(fileUploadSource).toContain("label={t('canvas.chatConfig.enableFullFileUpload')}")
        expect(fileUploadSource).not.toContain('File Upload Configuration Saved')
        expect(fileUploadSource).not.toContain('Allow Uploads of Type')
        expect(fileUploadSource).not.toContain('One document per page')

        expect(rateLimitSource).toContain("throw new Error(t('canvas.chatConfig.rateLimitInputRequired'))")
        expect(rateLimitSource).toContain("message: t('canvas.chatConfig.rateLimitSaved')")
        expect(rateLimitSource).toContain("label={t('canvas.chatConfig.enableRateLimit')}")
        expect(rateLimitSource).not.toContain('Rate Limit Configuration Saved')
        expect(rateLimitSource).not.toContain('Enable Rate Limit')
        expect(rateLimitSource).not.toContain('Message Limit per Duration')

        expect(postProcessingSource).toContain("label: t('canvas.chatConfig.postProcessingFunction')")
        expect(postProcessingSource).toContain("message: t('canvas.chatConfig.postProcessingSaved')")
        expect(postProcessingSource).toContain("label={t('canvas.chatConfig.enablePostProcessing')}")
        expect(postProcessingSource).toContain("t('canvas.chatConfig.availableVariables')")
        expect(postProcessingSource).toContain("t('canvas.chatConfig.rawOutputDescription')")
        expect(postProcessingSource).not.toContain('Post Processing Settings Saved')
        expect(postProcessingSource).not.toContain('Enable Post Processing')
        expect(postProcessingSource).not.toContain('Available Variables')
        expect(postProcessingSource).not.toContain('The raw output response from the flow')

        expect(starterPromptsSource).toContain("message: t('canvas.chatConfig.starterPromptsSaved')")
        expect(starterPromptsSource).toContain("t('canvas.chatConfig.starterPromptsHint')")
        expect(starterPromptsSource).not.toContain('Conversation Starter Prompts Saved')
        expect(starterPromptsSource).not.toContain('Starter prompts will only be shown when there are no messages on the chat')

        expect(overrideSource).toContain("message: t('canvas.chatConfig.overrideSaved')")
        expect(overrideSource).toContain("t('canvas.chatConfig.overrideConfiguration')")
        expect(overrideSource).toContain("label={t('canvas.chatConfig.enableOverrideConfiguration')}")
        expect(overrideSource).toContain("t('canvas.chatConfig.schema')")
        expect(overrideSource).not.toContain('Override Configuration Saved')
        expect(overrideSource).not.toContain('Enable Override Configuration')
        expect(overrideSource).not.toContain('No schema available')
    })
})
