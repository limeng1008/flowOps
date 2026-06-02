const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

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
})
