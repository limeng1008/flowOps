import { findFirstFailedNode, getNodeTraceBadges } from './executionTraceUtils'

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
})
