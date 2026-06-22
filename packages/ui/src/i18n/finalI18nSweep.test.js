const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)

const requiredKeys = [
    'common.clear',
    'common.clearAll',
    'common.copy',
    'common.copied',
    'common.info',
    'common.status',
    'common.createNewOption',
    'common.new',
    'common.on',
    'auth.rateLimitTooManyRequests',
    'layout.trial.prefix',
    'layout.trial.daysLeft',
    'layout.trial.suffix',
    'layout.trial.paymentMethodNotice',
    'layout.trial.updatePaymentMethod',
    'canvas.toggleSnapping',
    'canvas.toggleBackground',
    'canvas.confirmChangeTitle',
    'canvas.changedOverwriteConfirm',
    'canvas.failedRetrieve',
    'canvas.elseBranch',
    'canvas.nodeInput.setupNimLocally',
    'components.markdown.copied',
    'components.feedback.additionalTitle',
    'components.feedback.responsePlaceholder',
    'components.feedback.submit',
    'components.nodeInfo.openDocumentation',
    'components.analytics.connectCredential',
    'components.analytics.projectName',
    'components.analytics.defaultDescription',
    'components.analytics.releaseDescription',
    'components.analytics.configurationSaved',
    'components.analytics.configurationSaveFailed',
    'components.errorBoundary.title',
    'components.errorBoundary.description',
    'components.errorBoundary.retry',
    'components.errorBoundary.raiseIssue',
    'components.validation.validateNodes',
    'components.validation.noIssuesFound',
    'components.validation.failed',
    'components.validation.checklist',
    'components.monthDaysPicker.lastDay',
    'components.monthDaysPicker.lastDayTooltip',
    'pages.marketplaces.shareCustomTemplate',
    'pages.marketplaces.deleteCustomTemplateTitle',
    'pages.marketplaces.deleteCustomTemplateConfirm',
    'pages.marketplaces.customTemplateDeleted',
    'pages.marketplaces.customTemplateDeleteFailed',
    'pages.chatflows.embed.popupHtml',
    'pages.chatflows.embed.fullpageHtml',
    'pages.chatflows.embed.popupReact',
    'pages.chatflows.embed.fullpageReact',
    'pages.chatflows.embedTheme.disclaimerMessage',
    'pages.documentStores.refreshAllLoadersTitle',
    'pages.documentStores.refreshAllLoadersConfirm',
    'pages.documentStores.deleteStoreLoadersConfirm',
    'pages.documentStores.deleteStoreLoadersWithVectorConfirm',
    'pages.documentStores.retrievalPlaygroundDescription',
    'pages.documentStores.enterQuery',
    'pages.roles.searchPlaceholder',
    'pages.roles.simplifiedDescription',
    'pages.roles.noRoles',
    'pages.roles.assignedUsers',
    'pages.chatMessage.defaultGreeting',
    'pages.chatMessage.messageStopped',
    'pages.chatMessage.clearHistoryConfirm',
    'pages.chatMessage.clearHistorySuccess'
]

describe('final i18n sweep coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('routes shared markdown, feedback, node info, analytics, validation, and chat copy through i18n', () => {
        const codeBlockSource = fs.readFileSync(path.join(__dirname, '../ui-component/markdown/CodeBlock.jsx'), 'utf8')
        const feedbackSource = fs.readFileSync(path.join(__dirname, '../ui-component/dialog/ChatFeedbackContentDialog.jsx'), 'utf8')
        const nodeInfoSource = fs.readFileSync(path.join(__dirname, '../ui-component/dialog/NodeInfoDialog.jsx'), 'utf8')
        const analyticsSource = fs.readFileSync(path.join(__dirname, '../ui-component/extended/AnalyseFlow.jsx'), 'utf8')
        const validationSource = fs.readFileSync(path.join(__dirname, '../views/chatmessage/ValidationPopUp.jsx'), 'utf8')
        const chatMessageSource = fs.readFileSync(path.join(__dirname, '../views/chatmessage/ChatMessage.jsx'), 'utf8')
        const chatPopUpSource = fs.readFileSync(path.join(__dirname, '../views/chatmessage/ChatPopUp.jsx'), 'utf8')
        const embedChatSource = fs.readFileSync(path.join(__dirname, '../views/chatflows/EmbedChat.jsx'), 'utf8')
        const documentStoreSource = fs.readFileSync(path.join(__dirname, '../views/docstore/DocumentStoreDetail.jsx'), 'utf8')
        const vectorStoreQuerySource = fs.readFileSync(path.join(__dirname, '../views/docstore/VectorStoreQuery.jsx'), 'utf8')
        const arrayRendererSource = fs.readFileSync(path.join(__dirname, '../ui-component/array/ArrayRenderer.jsx'), 'utf8')
        const errorBoundarySource = fs.readFileSync(path.join(__dirname, '../ErrorBoundary.jsx'), 'utf8')
        const errorContextSource = fs.readFileSync(path.join(__dirname, '../store/context/ErrorContext.jsx'), 'utf8')
        const trialInfoSource = fs.readFileSync(path.join(__dirname, '../layout/MainLayout/Sidebar/TrialInfo.jsx'), 'utf8')
        const monthDaysPickerSource = fs.readFileSync(path.join(__dirname, '../ui-component/picker/MonthDaysPicker.jsx'), 'utf8')

        expect(codeBlockSource).toContain("title={t('common.copy')}")
        expect(codeBlockSource).toContain("t('components.markdown.copied')")
        expect(feedbackSource).toContain("t('components.feedback.additionalTitle')")
        expect(nodeInfoSource).toContain("title={t('components.nodeInfo.openDocumentation')}")
        expect(analyticsSource).toContain("message: t('components.analytics.configurationSaved')")
        expect(validationSource).toContain("title={t('components.validation.validateNodes')}")
        expect(chatMessageSource).toContain("t('pages.chatMessage.defaultGreeting')")
        expect(chatPopUpSource).toContain("t('pages.chatMessage.clearHistoryConfirm')")
        expect(embedChatSource).toContain('getDefaultThemeConfig(t)')
        expect(documentStoreSource).toContain("t('pages.documentStores.refreshAllLoadersTitle')")
        expect(vectorStoreQuerySource).toContain("t('pages.documentStores.retrievalPlaygroundDescription')")
        expect(vectorStoreQuerySource).toContain("t('pages.documentStores.enterQuery')")
        expect(arrayRendererSource).toContain("t('canvas.elseBranch')")
        expect(errorBoundarySource).toContain("t('components.errorBoundary.title')")
        expect(errorContextSource).toContain("t('auth.rateLimitTooManyRequests')")
        expect(trialInfoSource).toContain("t('layout.trial.paymentMethodNotice')")
        expect(monthDaysPickerSource).toContain("t('components.monthDaysPicker.lastDayTooltip')")
        expect(codeBlockSource).not.toContain("title='Copy'")
        expect(codeBlockSource).not.toContain('Copied!')
        expect(feedbackSource).not.toContain('Provide additional feedback')
        expect(feedbackSource).not.toContain('Submit Feedback')
        expect(nodeInfoSource).not.toContain('Open Documentation')
        expect(analyticsSource).not.toContain('Analytic Configuration Saved')
        expect(validationSource).not.toContain('No issues found in your flow!')
        expect(validationSource).not.toContain("title='Validate Nodes'")
        expect(chatMessageSource).not.toContain('Message stopped')
        expect(chatPopUpSource).not.toContain('Successfully cleared all chat history')
        expect(embedChatSource).not.toContain('By using this chatbot')
        expect(embedChatSource).not.toContain('Start Chatting')
        expect(documentStoreSource).not.toContain('Refresh all loaders and upsert all chunks?')
        expect(vectorStoreQuerySource).not.toContain('Retrieval Playground - Test your vector store retrieval settings')
        expect(vectorStoreQuerySource).not.toContain('Enter your Query')
        expect(arrayRendererSource).not.toContain("description: 'Else'")
        expect(errorBoundarySource).not.toContain('Oh snap!')
        expect(errorBoundarySource).not.toContain('The following error occurred when loading this page.')
        expect(errorBoundarySource).not.toContain('Please retry after some time.')
        expect(errorContextSource).not.toContain("You're making a lot of requests.")
        expect(trialInfoSource).not.toContain('Update your payment method to avoid service interruption.')
        expect(monthDaysPickerSource).not.toContain('Always runs on the last day of every month')
    })

    it('routes marketplace, canvas controls, node dialogs, and role actions through i18n', () => {
        const marketplaceSource = fs.readFileSync(path.join(__dirname, '../views/marketplaces/index.jsx'), 'utf8')
        const marketplaceCanvasSource = fs.readFileSync(path.join(__dirname, '../views/marketplaces/MarketplaceCanvas.jsx'), 'utf8')
        const marketplaceNodeSource = fs.readFileSync(path.join(__dirname, '../views/marketplaces/MarketplaceCanvasNode.jsx'), 'utf8')
        const marketplaceHeaderSource = fs.readFileSync(path.join(__dirname, '../views/marketplaces/MarketplaceCanvasHeader.jsx'), 'utf8')
        const canvasSource = fs.readFileSync(path.join(__dirname, '../views/canvas/index.jsx'), 'utf8')
        const canvasNodeSource = fs.readFileSync(path.join(__dirname, '../views/canvas/CanvasNode.jsx'), 'utf8')
        const nodeInputSource = fs.readFileSync(path.join(__dirname, '../views/canvas/NodeInputHandler.jsx'), 'utf8')
        const credentialInputSource = fs.readFileSync(path.join(__dirname, '../views/canvas/CredentialInputHandler.jsx'), 'utf8')
        const nodeOutputSource = fs.readFileSync(path.join(__dirname, '../views/canvas/NodeOutputHandler.jsx'), 'utf8')
        const addNodesSource = fs.readFileSync(path.join(__dirname, '../views/canvas/AddNodes.jsx'), 'utf8')
        const agentflowCanvasSource = fs.readFileSync(path.join(__dirname, '../views/agentflowsv2/Canvas.jsx'), 'utf8')
        const agentflowNodeSource = fs.readFileSync(path.join(__dirname, '../views/agentflowsv2/AgentFlowNode.jsx'), 'utf8')
        const iterationNodeSource = fs.readFileSync(path.join(__dirname, '../views/agentflowsv2/IterationNode.jsx'), 'utf8')
        const rolesSource = fs.readFileSync(path.join(__dirname, '../views/roles/index.jsx'), 'utf8')
        const agentflowsSource = fs.readFileSync(path.join(__dirname, '../views/agentflows/index.jsx'), 'utf8')
        const analyticsSource = fs.readFileSync(path.join(__dirname, '../ui-component/extended/AnalyseFlow.jsx'), 'utf8')

        expect(marketplaceSource).toContain("t('pages.marketplaces.shareCustomTemplate')")
        expect(marketplaceCanvasSource).toContain("title={t('canvas.toggleSnapping')}")
        expect(marketplaceNodeSource).toContain("confirmButtonName: t('common.save')")
        expect(marketplaceHeaderSource).toContain("title={t('common.useTemplate')}")
        expect(canvasSource).toContain("title: t('canvas.confirmChangeTitle')")
        expect(canvasSource).toContain("title={t('canvas.toggleSnapping')}")
        expect(canvasNodeSource).toContain("title={t('common.info')}")
        expect(nodeInputSource).toContain("t('canvas.nodeInput.setupNimLocally')")
        expect(nodeInputSource).toContain("t('pages.documentStores.manageLinks')")
        expect(credentialInputSource).toContain("t('common.chooseOption')")
        expect(nodeOutputSource).toContain("t('common.chooseOption')")
        expect(addNodesSource).toContain("t('canvas.byAuthor'")
        expect(agentflowCanvasSource).toContain("title={t('canvas.toggleSnapping')}")
        expect(agentflowNodeSource).toContain("title={t('common.info')}")
        expect(iterationNodeSource).toContain("title={t('common.info')}")
        expect(rolesSource).toContain("searchPlaceholder={t('pages.roles.searchPlaceholder')}")
        expect(rolesSource).toContain("description={t('pages.roles.simplifiedDescription')}")
        expect(rolesSource).toContain("t('pages.roles.noRoles')")
        expect(rolesSource).toContain("t('pages.roles.assignedUsers')")
        expect(rolesSource).toContain('getFlowOpsRoleLabel')
        expect(rolesSource).toContain('getFlowOpsRoleDescription')
        expect(agentflowsSource).toContain("label={t('common.new')}")
        expect(analyticsSource).toContain("t('common.on')")
        expect(marketplaceSource).not.toContain("'Add New Tool'")
        expect(marketplaceCanvasSource).not.toContain("title='toggle snapping'")
        expect(canvasSource).not.toContain('Confirm Change')
        expect(canvasNodeSource).not.toContain("title='Info'")
        expect(nodeInputSource).not.toContain('Setup NIM Locally')
        expect(nodeInputSource).not.toContain("'choose an option'")
        expect(credentialInputSource).not.toContain("'choose an option'")
        expect(addNodesSource).not.toContain('By {node.author}')
        expect(rolesSource).not.toContain('Role deleted')
        expect(agentflowsSource).not.toContain("label='NEW'")
        expect(analyticsSource).not.toContain('>ON<')
    })

    it('routes shared dropdown option labels through node i18n', () => {
        const dropdownSource = fs.readFileSync(path.join(__dirname, '../ui-component/dropdown/Dropdown.jsx'), 'utf8')
        const multiDropdownSource = fs.readFileSync(path.join(__dirname, '../ui-component/dropdown/MultiDropdown.jsx'), 'utf8')
        const asyncDropdownSource = fs.readFileSync(path.join(__dirname, '../ui-component/dropdown/AsyncDropdown.jsx'), 'utf8')

        expect(dropdownSource).toContain('translateNodeLabel(option.label, currentLang)')
        expect(dropdownSource).toContain('translateNodeDescription(option.description, currentLang)')
        expect(dropdownSource).toContain('getOptionLabel={getTranslatedOptionLabel}')
        expect(multiDropdownSource).toContain('translateNodeLabel(option.label, currentLang)')
        expect(multiDropdownSource).toContain('translateNodeDescription(option.description, currentLang)')
        expect(multiDropdownSource).toContain('getOptionLabel={getTranslatedOptionLabel}')
        expect(asyncDropdownSource).toContain('translateNodeLabel(option.label, currentLang)')
        expect(asyncDropdownSource).toContain('translateNodeDescription(option.description, currentLang)')
        expect(asyncDropdownSource).toContain('getOptionLabel={getTranslatedOptionLabel}')
        expect(multiDropdownSource).toContain("t('common.chooseOption')")
        expect(asyncDropdownSource).toContain("t('common.chooseOption')")
        expect(asyncDropdownSource).toContain("label: t('common.createNewOption')")
        expect(multiDropdownSource).toContain('isChooseOptionValue')
        expect(asyncDropdownSource).toContain('isChooseOptionValue')
        expect(asyncDropdownSource).not.toContain("label: '- Create New -'")
        expect(multiDropdownSource).not.toContain('{option.label}')
        expect(asyncDropdownSource).not.toContain('{option.label}')
    })
})
