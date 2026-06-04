import { buildExecutionExportPayload, findFirstFailedNode, getNodeTraceBadges } from './executionTraceUtils'

describe('execution trace utilities', () => {
    it('finds the first failed node in a nested execution tree', () => {
        const tree = [
            {
                id: 'start_0',
                label: 'Start',
                status: 'FINISHED',
                children: [
                    {
                        id: 'agent_1',
                        label: 'Agent',
                        status: 'ERROR',
                        data: { error: 'Model failed' },
                        children: []
                    }
                ]
            }
        ]

        expect(findFirstFailedNode(tree)).toEqual(
            expect.objectContaining({
                id: 'agent_1',
                label: 'Agent',
                status: 'ERROR'
            })
        )
    })

    it('returns only badges supported by recorded node output data', () => {
        const node = {
            status: 'FINISHED',
            data: {
                output: {
                    timeMetadata: { delta: 1234 },
                    usageMetadata: {
                        total_tokens: 88,
                        total_cost: 0.0042
                    }
                }
            }
        }

        expect(getNodeTraceBadges(node)).toEqual([
            { type: 'status', status: 'FINISHED' },
            { type: 'duration', seconds: '1.23' },
            { type: 'tokens', tokens: 88 },
            { type: 'cost', cost: '0.004200' }
        ])
    })

    it('builds a support-friendly execution export payload from recorded metadata and nodes', () => {
        const payload = buildExecutionExportPayload({
            exportedAt: '2026-06-04T00:00:00.000Z',
            metadata: {
                id: 'exec-1',
                state: 'ERROR',
                agentflowId: 'flow-1',
                sessionId: 'session-1',
                agentflow: { id: 'flow-1', name: 'Support Flow' }
            },
            executionTree: [
                {
                    id: 'agent_0',
                    label: 'Agent',
                    name: 'agentAgentflow',
                    status: 'ERROR',
                    data: {
                        input: { question: 'hello' },
                        output: { content: 'partial answer' },
                        error: 'Model failed'
                    },
                    children: []
                }
            ]
        })

        expect(payload).toEqual({
            exportedAt: '2026-06-04T00:00:00.000Z',
            execution: {
                id: 'exec-1',
                state: 'ERROR',
                agentflowId: 'flow-1',
                agentflowName: 'Support Flow',
                sessionId: 'session-1',
                createdDate: undefined,
                updatedDate: undefined
            },
            nodes: [
                {
                    id: 'agent_0',
                    label: 'Agent',
                    name: 'agentAgentflow',
                    status: 'ERROR',
                    input: { question: 'hello' },
                    output: { content: 'partial answer' },
                    error: 'Model failed',
                    state: undefined
                }
            ]
        })
    })
})
