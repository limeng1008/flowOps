export const FAILED_STATUSES = new Set(['ERROR', 'TIMEOUT'])

export const STATUS_VARIANT = {
    FINISHED: 'success',
    ERROR: 'error',
    TIMEOUT: 'error',
    TERMINATED: 'error',
    STOPPED: 'error',
    INPROGRESS: 'warning'
}

export const findFirstFailedNode = (nodes = []) => {
    for (const node of nodes) {
        if (FAILED_STATUSES.has(node?.status)) return node
        const failedChild = findFirstFailedNode(node?.children || [])
        if (failedChild) return failedChild
    }
    return null
}

const formatCost = (cost) => {
    const numericCost = Number(cost)
    if (!Number.isFinite(numericCost) || numericCost < 0) return null
    return numericCost >= 0.01 ? numericCost.toFixed(2) : numericCost.toFixed(6)
}

export const getNodeTraceBadges = (node = {}) => {
    const badges = []
    if (node.status) {
        badges.push({ type: 'status', status: node.status })
    }

    const output = node.data?.output
    const delta = output?.timeMetadata?.delta
    if (Number.isFinite(Number(delta)) && Number(delta) >= 0) {
        badges.push({ type: 'duration', seconds: (Number(delta) / 1000).toFixed(2) })
    }

    const tokens = output?.usageMetadata?.total_tokens
    if (tokens !== undefined && tokens !== null) {
        badges.push({ type: 'tokens', tokens })
    }

    const cost = formatCost(output?.usageMetadata?.total_cost)
    if (cost !== null) {
        badges.push({ type: 'cost', cost })
    }

    return badges
}

const flattenExecutionNodes = (nodes = []) => {
    const flattened = []

    nodes.forEach((node) => {
        flattened.push({
            id: node.id,
            label: node.label,
            name: node.name || node.data?.name,
            status: node.status,
            input: node.data?.input,
            output: node.data?.output,
            error: node.data?.error,
            state: node.data?.state
        })

        flattened.push(...flattenExecutionNodes(node.children || []))
    })

    return flattened
}

export const buildExecutionExportPayload = ({ metadata = {}, executionTree = [], exportedAt = new Date().toISOString() } = {}) => ({
    exportedAt,
    execution: {
        id: metadata.id,
        state: metadata.state,
        agentflowId: metadata.agentflowId || metadata.agentflow?.id,
        agentflowName: metadata.agentflowName || metadata.agentflow?.name,
        sessionId: metadata.sessionId,
        createdDate: metadata.createdDate,
        updatedDate: metadata.updatedDate
    },
    nodes: flattenExecutionNodes(executionTree)
})
