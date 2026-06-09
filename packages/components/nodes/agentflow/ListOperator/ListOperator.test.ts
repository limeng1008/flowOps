const { nodeClass: ListOperator } = require('./ListOperator')

const baseOptions = { agentflowRuntime: { state: { kept: true } } }

describe('ListOperator agentflow node', () => {
    it('is an Agent Flows node with array input and operation controls', () => {
        const node = new ListOperator()
        expect(node.label).toBe('List Operator')
        expect(node.name).toBe('listOperatorAgentflow')
        expect(node.category).toBe('Agent Flows')
        expect(node.inputs.map((i: any) => i.name)).toEqual(
            expect.arrayContaining([
                'listOperatorInput',
                'listOperatorOperation',
                'listOperatorField',
                'listOperatorFilterOperator',
                'listOperatorValue',
                'listOperatorOrder',
                'listOperatorStart',
                'listOperatorEnd',
                'listOperatorCount'
            ])
        )
    })

    it('filters a JSON array by nested field value', async () => {
        const node = new ListOperator()
        const res = await node.run(
            {
                id: 'listOperatorAgentflow_0',
                inputs: {
                    listOperatorInput: JSON.stringify([
                        { id: 1, customer: { tier: 'vip' }, amount: 120 },
                        { id: 2, customer: { tier: 'normal' }, amount: 60 }
                    ]),
                    listOperatorOperation: 'filter',
                    listOperatorField: 'customer.tier',
                    listOperatorFilterOperator: 'equals',
                    listOperatorValue: 'vip'
                }
            },
            '',
            baseOptions
        )

        expect(res.output.content).toEqual([{ id: 1, customer: { tier: 'vip' }, amount: 120 }])
        expect(res.output.count).toBe(1)
        expect(res.state).toEqual({ kept: true })
    })

    it('sorts, slices, limits, and extracts fields without mutating the input array', async () => {
        const node = new ListOperator()
        const rows = [
            { id: 1, score: 70, owner: { name: 'B' } },
            { id: 2, score: 95, owner: { name: 'A' } },
            { id: 3, score: 80, owner: { name: 'C' } }
        ]

        const sorted = await node.run(
            {
                id: 'listOperatorAgentflow_0',
                inputs: {
                    listOperatorInput: rows,
                    listOperatorOperation: 'sort',
                    listOperatorField: 'score',
                    listOperatorOrder: 'desc'
                }
            },
            '',
            baseOptions
        )
        expect(sorted.output.content.map((item: any) => item.id)).toEqual([2, 3, 1])
        expect(rows.map((item) => item.id)).toEqual([1, 2, 3])

        const sliced = await node.run(
            {
                id: 'listOperatorAgentflow_0',
                inputs: {
                    listOperatorInput: rows,
                    listOperatorOperation: 'slice',
                    listOperatorStart: 1,
                    listOperatorEnd: 3
                }
            },
            '',
            baseOptions
        )
        expect(sliced.output.content.map((item: any) => item.id)).toEqual([2, 3])

        const limited = await node.run(
            {
                id: 'listOperatorAgentflow_0',
                inputs: {
                    listOperatorInput: rows,
                    listOperatorOperation: 'limit',
                    listOperatorCount: 2
                }
            },
            '',
            baseOptions
        )
        expect(limited.output.content.map((item: any) => item.id)).toEqual([1, 2])

        const extracted = await node.run(
            {
                id: 'listOperatorAgentflow_0',
                inputs: {
                    listOperatorInput: rows,
                    listOperatorOperation: 'extractField',
                    listOperatorField: 'owner.name'
                }
            },
            '',
            baseOptions
        )
        expect(extracted.output.content).toEqual(['B', 'A', 'C'])
    })

    it('returns an empty array and operation error for invalid input instead of throwing', async () => {
        const node = new ListOperator()
        const res = await node.run(
            {
                id: 'listOperatorAgentflow_0',
                inputs: {
                    listOperatorInput: '{"not":"an array"}',
                    listOperatorOperation: 'filter',
                    listOperatorField: 'status',
                    listOperatorValue: 'paid'
                }
            },
            '',
            baseOptions
        )

        expect(res.output.content).toEqual([])
        expect(res.output.count).toBe(0)
        expect(res.output._operationError).toContain('JSON array')
    })
})
