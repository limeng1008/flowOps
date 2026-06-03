const en = require('./locales/en.json')
const zh = require('./locales/zh.json')
const fs = require('fs')
const path = require('path')

const requiredKeys = [
    'canvas.dialogs.fromDate',
    'canvas.dialogs.toDate',
    'canvas.dialogs.source',
    'canvas.dialogs.feedback',
    'canvas.dialogs.sourceUI',
    'canvas.dialogs.sourceApiEmbed',
    'canvas.dialogs.sourceMcp',
    'canvas.dialogs.sourceScheduled',
    'canvas.dialogs.sourceWebhook',
    'canvas.dialogs.sourceEvaluations',
    'canvas.dialogs.feedbackPositive',
    'canvas.dialogs.feedbackNegative',
    'canvas.dialogs.moreActions',
    'canvas.dialogs.exportJson',
    'canvas.dialogs.deleteAll',
    'canvas.dialogs.totalSessions',
    'canvas.dialogs.totalMessages',
    'canvas.dialogs.totalFeedbackReceived',
    'canvas.dialogs.positiveFeedback',
    'canvas.dialogs.noMessages',
    'canvas.dialogs.sessionsRange',
    'canvas.dialogs.sessionId',
    'canvas.dialogs.memory',
    'canvas.dialogs.email',
    'canvas.dialogs.clearMessage',
    'canvas.dialogs.memoryNodeHelp',
    'canvas.dialogs.usedTools',
    'canvas.dialogs.state',
    'canvas.dialogs.removeMemoryNodeMessages',
    'canvas.dialogs.deleteMessagesTitle',
    'canvas.dialogs.deleteMessagesConfirm',
    'canvas.dialogs.deleteMessagesSuccess',
    'canvas.dialogs.exportMessagesSuccess',
    'canvas.dialogs.exportMessagesFail',
    'canvas.dialogs.clearSessionTitle',
    'canvas.dialogs.clearSessionConfirm',
    'canvas.dialogs.clearMessagesConfirm',
    'canvas.dialogs.clearSessionSuccess',
    'canvas.dialogs.clearMessagesSuccess',
    'canvas.dialogs.upsertDeleteSuccess',
    'canvas.dialogs.upsertDeleteFail',
    'canvas.dialogs.deleteRows',
    'canvas.dialogs.noUpsertHistory',
    'canvas.dialogs.added',
    'canvas.dialogs.updated',
    'canvas.dialogs.skipped',
    'canvas.dialogs.deleted',
    'canvas.dialogs.details',
    'canvas.dialogs.addedTooltip',
    'canvas.dialogs.updatedTooltip',
    'canvas.dialogs.skippedTooltip',
    'canvas.dialogs.deletedTooltip',
    'canvas.dialogs.enabled',
    'canvas.agentflowGenerator.title',
    'canvas.agentflowGenerator.description',
    'canvas.agentflowGenerator.promptWebReport',
    'canvas.agentflowGenerator.promptSummarizeDocument',
    'canvas.agentflowGenerator.promptSlackResponse',
    'canvas.agentflowGenerator.promptCustomerSupportTeam',
    'canvas.agentflowGenerator.placeholder',
    'canvas.agentflowGenerator.selectModel',
    'canvas.agentflowGenerator.generate',
    'canvas.agentflowGenerator.generating',
    'canvas.agentflowGenerator.failed',
    'canvas.agentflowGenerator.missingFields',
    'canvas.nodeWarnings.outdatedVersion',
    'canvas.nodeWarnings.outdated',
    'canvas.nodeWarnings.deprecatingFallback',
    'common.date',
    'common.selectAll',
    'common.export'
]

const get = (obj, path) => path.split('.').reduce((acc, part) => acc?.[part], obj)

describe('canvas dialog i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('routes Agentflow generator dialog copy through i18n', () => {
        const addNodesSource = fs.readFileSync(path.join(__dirname, '../views/canvas/AddNodes.jsx'), 'utf8')
        const dialogSource = fs.readFileSync(path.join(__dirname, '../ui-component/dialog/AgentflowGeneratorDialog.jsx'), 'utf8')

        expect(addNodesSource).toContain("t('canvas.agentflowGenerator.title')")
        expect(addNodesSource).toContain("t('canvas.agentflowGenerator.description')")
        expect(dialogSource).toContain("key: 'canvas.agentflowGenerator.promptWebReport'")
        expect(dialogSource).toContain('const instructionText = t(instruction.key)')
        expect(dialogSource).toContain("t('canvas.agentflowGenerator.placeholder')")
        expect(dialogSource).toContain("t('canvas.agentflowGenerator.selectModel')")
        expect(dialogSource).not.toContain('What would you like to build?')
        expect(dialogSource).not.toContain('Describe your agent here')
    })

    it('routes canvas node warning tooltip copy through i18n', () => {
        const canvasNodeSource = fs.readFileSync(path.join(__dirname, '../views/canvas/CanvasNode.jsx'), 'utf8')
        const agentFlowNodeSource = fs.readFileSync(path.join(__dirname, '../views/agentflowsv2/AgentFlowNode.jsx'), 'utf8')

        expect(canvasNodeSource).toContain("t('canvas.nodeWarnings.outdatedVersion'")
        expect(canvasNodeSource).toContain("t('canvas.nodeWarnings.outdated'")
        expect(agentFlowNodeSource).toContain("t('canvas.nodeWarnings.outdatedVersion'")
        expect(agentFlowNodeSource).toContain("t('canvas.nodeWarnings.outdated'")
        expect(canvasNodeSource).not.toContain('Node version ${oldVersion} outdated')
        expect(agentFlowNodeSource).not.toContain('Node version ${oldVersion} outdated')
    })
})
