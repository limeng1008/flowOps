const exactMessageKeys = {
    'Chatflow saved': 'snackbar.chatflowSaved',
    'Agentflow saved': 'snackbar.agentflowSaved',
    'Schedule enabled successfully': 'snackbar.scheduleEnabled',
    'Schedule disabled successfully': 'snackbar.scheduleDisabled',
    'Failed to toggle schedule': 'snackbar.scheduleToggleFailed'
}

const targetKeys = {
    'api key': 'snackbar.targets.apiKey',
    'document store': 'snackbar.targets.documentStore',
    'document loader': 'snackbar.targets.documentLoader',
    tool: 'snackbar.targets.tool',
    variable: 'snackbar.targets.variable',
    'vector store config': 'snackbar.targets.vectorStoreConfig',
    chunk: 'snackbar.targets.chunk'
}

const translateTarget = (target, t) => {
    const key = targetKeys[target.trim().toLowerCase()]
    return key ? t(key) : target
}

const translateActionTargetFailure = (actionKey, target, detail, t) =>
    t('snackbar.failedActionTarget', {
        action: t(actionKey),
        target: translateTarget(target, t),
        message: detail
    })

const patternMessageTranslators = [
    {
        pattern: /^Please fill in the following mandatory fields:\s*(.+)$/i,
        translate: (match, t) => t('snackbar.mandatoryFields', { fields: match[1] })
    },
    {
        pattern: /^Failed to add new (.+?):\s*(.+)$/i,
        translate: (match, t) => translateActionTargetFailure('snackbar.actions.addNew', match[1], match[2], t)
    },
    {
        pattern: /^Failed to save (.+?):\s*(.+)$/i,
        translate: (match, t) => translateActionTargetFailure('snackbar.actions.save', match[1], match[2], t)
    },
    {
        pattern: /^Failed to delete (.+?):\s*(.+)$/i,
        translate: (match, t) => translateActionTargetFailure('snackbar.actions.delete', match[1], match[2], t)
    },
    {
        pattern: /^Failed to update (.+?):\s*(.+)$/i,
        translate: (match, t) => translateActionTargetFailure('snackbar.actions.update', match[1], match[2], t)
    },
    {
        pattern: /^Failed to refresh (.+?):\s*(.+)$/i,
        translate: (match, t) => translateActionTargetFailure('snackbar.actions.refresh', match[1], match[2], t)
    },
    {
        pattern: /^Failed to export (.+?):\s*(.+)$/i,
        translate: (match, t) => translateActionTargetFailure('snackbar.actions.export', match[1], match[2], t)
    },
    {
        pattern: /^Failed to retrieve (.+?):\s*(.+)$/i,
        translate: (match, t) => translateActionTargetFailure('snackbar.actions.retrieve', match[1], match[2], t)
    },
    {
        pattern: /^Failed to preview chunks:\s*(.+)$/i,
        translate: (match, t) =>
            t('snackbar.failedActionOnly', {
                action: t('snackbar.actions.previewChunks'),
                message: match[1]
            })
    },
    {
        pattern: /^Failed to process chunking:\s*(.+)$/i,
        translate: (match, t) =>
            t('snackbar.failedActionOnly', {
                action: t('snackbar.actions.processChunking'),
                message: match[1]
            })
    },
    {
        pattern: /^Failed\s*:\s*(.+)$/i,
        translate: (match, t) => t('snackbar.failedWithMessage', { message: match[1] })
    },
    {
        pattern: /^TTS failed:\s*(.+)$/i,
        translate: (match, t) => t('snackbar.ttsFailed', { message: match[1] })
    },
    {
        pattern: /^TTS request failed:\s*(.+)$/i,
        translate: (match, t) => t('snackbar.ttsRequestFailed', { status: match[1] })
    },
    {
        pattern: /^HTTP error! status:\s*(.+)$/i,
        translate: (match, t) => t('snackbar.httpStatusError', { status: match[1] })
    }
]

export const translateSnackbarMessage = (message, t) => {
    if (typeof message !== 'string') return message

    const trimmedMessage = message.trim()
    const exactKey = exactMessageKeys[trimmedMessage]
    if (exactKey) return t(exactKey)

    for (const { pattern, translate } of patternMessageTranslators) {
        const match = trimmedMessage.match(pattern)
        if (match) return translate(match, t)
    }

    return message
}
