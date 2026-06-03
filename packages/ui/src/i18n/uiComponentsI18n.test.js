const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const requiredKeys = [
    'common.download',
    'common.next',
    'common.error',
    'uiComponents.buttons.copyToClipboard',
    'uiComponents.buttons.thumbsUp',
    'uiComponents.buttons.thumbsDown',
    'uiComponents.table.enabled',
    'uiComponents.table.disabled',
    'uiComponents.table.override',
    'uiComponents.table.overrideHelp',
    'uiComponents.table.schema',
    'uiComponents.table.noSchemaAvailable',
    'uiComponents.table.serverUrl',
    'uiComponents.table.status',
    'uiComponents.table.session',
    'uiComponents.table.toolCount',
    'uiComponents.table.moreItems',
    'uiComponents.promptHub.model',
    'uiComponents.promptHub.usecase',
    'uiComponents.promptHub.loadingPrompts',
    'uiComponents.promptHub.noAvailablePrompts',
    'uiComponents.promptHub.availablePrompts',
    'uiComponents.promptHub.prompt',
    'uiComponents.promptHub.readme',
    'uiComponents.dialogs.sourceDocuments',
    'uiComponents.tags.title',
    'uiComponents.tags.addTag',
    'uiComponents.tags.help',
    'uiComponents.share.itemsShared',
    'uiComponents.share.failed',
    'uiComponents.inviteUsers.title',
    'uiComponents.inviteUsers.selectUsers',
    'uiComponents.inviteUsers.inviteByNameOrEmail',
    'uiComponents.inviteUsers.noResults',
    'uiComponents.inviteUsers.inviteEmail',
    'uiComponents.inviteUsers.roleToAssign',
    'uiComponents.inviteUsers.selectRole',
    'uiComponents.inviteUsers.invalidEmailsRemoved',
    'uiComponents.inviteUsers.alreadyInWorkspaceOrOrganization',
    'uiComponents.inviteUsers.invitedToWorkspace',
    'uiComponents.inviteUsers.noDataReceived',
    'uiComponents.inviteUsers.failedInvite',
    'uiComponents.inviteUsers.alreadyMemberTooltip',
    'uiComponents.inviteUsers.invitationTooltip',
    'uiComponents.mcp.status.pending',
    'uiComponents.mcp.status.authorized',
    'uiComponents.mcp.status.error',
    'uiComponents.nvidia.setupTitle',
    'uiComponents.nvidia.stepDownloadInstaller',
    'uiComponents.nvidia.stepPullImage',
    'uiComponents.nvidia.stepStartContainer',
    'uiComponents.nvidia.failedDownloadInstaller',
    'uiComponents.nvidia.failedPreload',
    'uiComponents.nvidia.failedCheckImageStatus',
    'uiComponents.nvidia.failedPullImage',
    'uiComponents.nvidia.portInUse',
    'uiComponents.nvidia.failedCheckContainerStatus',
    'uiComponents.nvidia.failedStartContainer',
    'uiComponents.nvidia.enterImageTag',
    'uiComponents.nvidia.validPort',
    'uiComponents.nvidia.downloadInstallerPrompt',
    'uiComponents.nvidia.model',
    'uiComponents.nvidia.viewLicense',
    'uiComponents.nvidia.pullingImage',
    'uiComponents.nvidia.startingContainer',
    'uiComponents.nvidia.relaxMemoryConstraints',
    'uiComponents.nvidia.hostPort',
    'uiComponents.nvidia.startContainerPrompt',
    'uiComponents.nvidia.containerAlreadyExists',
    'uiComponents.nvidia.containerExistsDesc',
    'uiComponents.nvidia.youCan',
    'uiComponents.nvidia.useExistingRecommended',
    'uiComponents.nvidia.changePortAndRetry',
    'uiComponents.nvidia.useExisting',
    'uiComponents.nvidia.notAvailable'
]

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)
const read = (filePath) => fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8')

describe('ui-component i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('localizes shared icon button titles', () => {
        const copySource = read('ui-component/button/CopyToClipboardButton.jsx')
        const thumbsUpSource = read('ui-component/button/ThumbsUpButton.jsx')
        const thumbsDownSource = read('ui-component/button/ThumbsDownButton.jsx')

        expect(copySource).toContain("title={t('uiComponents.buttons.copyToClipboard')}")
        expect(thumbsUpSource).toContain("title={t('uiComponents.buttons.thumbsUp')}")
        expect(thumbsDownSource).toContain("title={t('uiComponents.buttons.thumbsDown')}")
        expect(copySource).not.toContain("title='Copy to clipboard'")
        expect(thumbsUpSource).not.toContain("title='Thumbs Up'")
        expect(thumbsDownSource).not.toContain("title='Thumbs Down'")
    })

    it('localizes generic table labels, MCP headers, status badges, counts, and dates', () => {
        const tableSource = read('ui-component/table/Table.jsx')
        const mcpSource = read('ui-component/table/MCPServersTable.jsx')
        const flowListSource = read('ui-component/table/FlowListTable.jsx')
        const executionsSource = read('ui-component/table/ExecutionsListTable.jsx')

        expect(tableSource).toContain("t('uiComponents.table.enabled')")
        expect(tableSource).toContain("t('uiComponents.table.disabled')")
        expect(tableSource).toContain("t('uiComponents.table.override')")
        expect(tableSource).toContain("t('uiComponents.table.overrideHelp')")
        expect(tableSource).toContain("t('uiComponents.table.schema')")
        expect(tableSource).toContain("t('uiComponents.table.noSchemaAvailable')")
        expect(tableSource).not.toContain("label='Enabled'")
        expect(tableSource).not.toContain("label='Disabled'")
        expect(tableSource).not.toContain('No schema available')
        expect(tableSource).not.toContain('If enabled, this variable can be overridden')

        expect(mcpSource).toContain("t('uiComponents.table.serverUrl')")
        expect(mcpSource).toContain("t('uiComponents.table.status')")
        expect(mcpSource).toContain("t('uiComponents.table.toolCount'")
        expect(mcpSource).toContain('statusI18nKeyMap')
        expect(mcpSource).not.toContain('<StyledTableCell>Server URL</StyledTableCell>')
        expect(mcpSource).not.toContain('<StyledTableCell>Status</StyledTableCell>')
        expect(mcpSource).not.toContain("? 'tool' : 'tools'")

        expect(flowListSource).toContain("t('uiComponents.table.moreItems'")
        expect(flowListSource).toContain('dateTimeFormat')
        expect(flowListSource).toContain("i18n.language?.startsWith('zh')")
        expect(flowListSource).not.toContain('} More')
        expect(flowListSource).not.toContain("format('MMMM Do, YYYY HH:mm:ss')")

        expect(executionsSource).toContain("t('uiComponents.table.status')")
        expect(executionsSource).toContain("t('uiComponents.table.session')")
        expect(executionsSource).toContain('dateTimeFormat')
        expect(executionsSource).toContain("i18n.language?.startsWith('zh')")
        expect(executionsSource).not.toContain('<StyledTableCell>Status</StyledTableCell>')
        expect(executionsSource).not.toContain('<StyledTableCell>Session</StyledTableCell>')
        expect(executionsSource).not.toContain("format('MMM D, YYYY h:mm A')")
    })

    it('localizes dialog fallback titles and prompt/tag/share copy', () => {
        const promptHubSource = read('ui-component/dialog/PromptLangsmithHubDialog.jsx')
        const speechSource = read('ui-component/dialog/SpeechToTextDialog.jsx')
        const sourceDocSource = read('ui-component/dialog/SourceDocDialog.jsx')
        const starterSource = read('ui-component/dialog/StarterPromptsDialog.jsx')
        const tagSource = read('ui-component/dialog/TagDialog.jsx')
        const shareSource = read('ui-component/dialog/ShareWithWorkspaceDialog.jsx')

        expect(promptHubSource).toContain("t('uiComponents.promptHub.model')")
        expect(promptHubSource).toContain("t('uiComponents.promptHub.usecase')")
        expect(promptHubSource).toContain("t('uiComponents.promptHub.loadingPrompts')")
        expect(promptHubSource).toContain("t('uiComponents.promptHub.noAvailablePrompts')")
        expect(promptHubSource).toContain("t('uiComponents.promptHub.availablePrompts')")
        expect(promptHubSource).toContain("t('uiComponents.promptHub.prompt')")
        expect(promptHubSource).toContain("t('uiComponents.promptHub.readme')")
        expect(promptHubSource).not.toContain('Please wait....loading Prompts')
        expect(promptHubSource).not.toContain('No Available Prompts')
        expect(promptHubSource).not.toContain('Available Prompts')
        expect(promptHubSource).not.toContain('<Typography>Prompt</Typography>')

        expect(speechSource).toContain("t('canvas.configDialog.speechToTextTitle')")
        expect(sourceDocSource).toContain("t('uiComponents.dialogs.sourceDocuments')")
        expect(sourceDocSource).toContain("t('common.error')")
        expect(starterSource).toContain("t('canvas.configDialog.starterPromptsTitle')")
        expect(speechSource).not.toContain("'Allowed Domains'")
        expect(sourceDocSource).not.toContain("'Source Documents'")
        expect(sourceDocSource).not.toContain('Error:')
        expect(starterSource).not.toContain("'Conversation Starter Prompts'")

        expect(tagSource).toContain("t('uiComponents.tags.title')")
        expect(tagSource).toContain("label={t('uiComponents.tags.addTag')}")
        expect(tagSource).toContain("t('uiComponents.tags.help')")
        expect(tagSource).not.toContain('Set Chatflow Category Tags')
        expect(tagSource).not.toContain("label='Add a tag'")
        expect(tagSource).not.toContain('Enter a tag and press enter')

        expect(shareSource).toContain("headerName: t('layout.workspace')")
        expect(shareSource).toContain("headerName: t('permissions.actions.share')")
        expect(shareSource).toContain("message: t('uiComponents.share.itemsShared')")
        expect(shareSource).toContain("t('uiComponents.share.failed'")
        expect(shareSource).not.toContain('Items Shared Successfully')
        expect(shareSource).not.toContain('Failed to share Item:')
        expect(shareSource).not.toContain("headerName: 'Workspace'")
    })

    it('localizes invite users dialog copy and notifications outside JSX text nodes', () => {
        const source = read('ui-component/dialog/InviteUsersDialog.jsx')

        expect(source).toContain("t('uiComponents.inviteUsers.title')")
        expect(source).toContain("t('uiComponents.inviteUsers.selectUsers')")
        expect(source).toContain("t('uiComponents.inviteUsers.inviteEmail'")
        expect(source).toContain("t('uiComponents.inviteUsers.noResults')")
        expect(source).toContain("placeholder={selectedUsers.length > 0 ? '' : t('uiComponents.inviteUsers.inviteByNameOrEmail')}")
        expect(source).toContain("t('uiComponents.inviteUsers.roleToAssign')")
        expect(source).toContain("placeholder={t('layout.selectWorkspace')}")
        expect(source).toContain("placeholder={t('uiComponents.inviteUsers.selectRole')}")
        expect(source).toContain("message: t('uiComponents.inviteUsers.invalidEmailsRemoved')")
        expect(source).toContain("message: t('uiComponents.inviteUsers.alreadyInWorkspaceOrOrganization'")
        expect(source).toContain("message: t('uiComponents.inviteUsers.invitedToWorkspace')")
        expect(source).toContain("t('uiComponents.inviteUsers.noDataReceived')")
        expect(source).toContain("t('uiComponents.inviteUsers.failedInvite'")
        expect(source).toContain("t('uiComponents.inviteUsers.alreadyMemberTooltip'")
        expect(source).toContain("t('uiComponents.inviteUsers.invitationTooltip')")
        expect(source).not.toContain('Invite Users')
        expect(source).not.toContain('Select Users')
        expect(source).not.toContain('Invite users by name or email')
        expect(source).not.toContain('No results found')
        expect(source).not.toContain('One or more invalid emails were removed.')
        expect(source).not.toContain('Users invited to workspace')
        expect(source).not.toContain('Failed to invite users to workspace:')
        expect(source).not.toContain('Role to Assign')
        expect(source).not.toContain('Select Role')
    })

    it('localizes Nvidia NIM setup dialog and alert copy', () => {
        const source = read('ui-component/dialog/NvidiaNIMDialog.jsx')

        expect(source).toContain("t('uiComponents.nvidia.setupTitle')")
        expect(source).toContain("t('uiComponents.nvidia.failedDownloadInstaller'")
        expect(source).toContain("t('uiComponents.nvidia.portInUse'")
        expect(source).toContain("t('uiComponents.nvidia.enterImageTag')")
        expect(source).toContain("t('uiComponents.nvidia.validPort')")
        expect(source).toContain("t('uiComponents.nvidia.downloadInstallerPrompt')")
        expect(source).toContain("t('uiComponents.nvidia.model')")
        expect(source).toContain("t('uiComponents.nvidia.viewLicense')")
        expect(source).toContain("t('uiComponents.nvidia.pullingImage')")
        expect(source).toContain("t('uiComponents.nvidia.startingContainer')")
        expect(source).toContain("t('uiComponents.nvidia.relaxMemoryConstraints')")
        expect(source).toContain("t('uiComponents.nvidia.hostPort')")
        expect(source).toContain("t('uiComponents.nvidia.containerAlreadyExists')")
        expect(source).toContain("t('uiComponents.nvidia.useExisting')")
        expect(source).not.toContain('NIM Setup')
        expect(source).not.toContain('Failed to download installer:')
        expect(source).not.toContain('Please enter an image tag')
        expect(source).not.toContain('Would you like to download the NIM installer?')
        expect(source).not.toContain('Pulling image...')
        expect(source).not.toContain('Starting container...')
        expect(source).not.toContain('Container Already Exists')
        expect(source).not.toContain('Use Existing')
    })
})
