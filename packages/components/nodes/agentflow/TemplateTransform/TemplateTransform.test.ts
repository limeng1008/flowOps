const fs = require('fs')
const path = require('path')
const { nodeClass: TemplateTransform } = require('./TemplateTransform')

export {}

const baseOptions = { agentflowRuntime: { state: { kept: true } } }

describe('TemplateTransform agentflow node', () => {
    it('is an Agent Flows node with template and variables inputs', () => {
        const node = new TemplateTransform()
        expect(node.label).toBe('Template Transform')
        expect(node.name).toBe('templateTransformAgentflow')
        expect(node.category).toBe('Agent Flows')
        expect(node.icon).toBe('templatetransform.svg')
        expect(fs.existsSync(path.join(__dirname, node.icon))).toBe(true)
        expect(node.inputs.map((i: any) => i.name)).toEqual(
            expect.arrayContaining(['templateTransformTemplate', 'templateTransformVariables'])
        )
    })

    it('renders {{ name }} placeholders with configured variables', async () => {
        const node = new TemplateTransform()
        const res = await node.run(
            {
                id: 'templateTransformAgentflow_0',
                inputs: {
                    templateTransformTemplate: '客户：{{ customerName }}\n金额：{{ amount }}\n标签：{{ tags }}',
                    templateTransformVariables: [
                        { variableName: 'customerName', variableValue: '张三' },
                        { variableName: 'amount', variableValue: 128 },
                        { variableName: 'tags', variableValue: ['vip', 'renewal'] }
                    ]
                }
            },
            '',
            baseOptions
        )

        expect(res.output.content).toBe('客户：张三\n金额：128\n标签：["vip","renewal"]')
        expect(res.output.missingVariables).toEqual([])
        expect(res.state).toEqual({ kept: true })
    })

    it('supports object-style variables and reports missing placeholders without throwing', async () => {
        const node = new TemplateTransform()
        const res = await node.run(
            {
                id: 'templateTransformAgentflow_0',
                inputs: {
                    templateTransformTemplate: '订单：{{ orderNo }}，状态：{{ status }}',
                    templateTransformVariables: { orderNo: 'A123' }
                }
            },
            '',
            baseOptions
        )

        expect(res.output.content).toBe('订单：A123，状态：')
        expect(res.output.missingVariables).toEqual(['status'])
        expect(res.output._transformNotice).toContain('status')
    })

    it('returns empty content and a notice for empty templates', async () => {
        const node = new TemplateTransform()
        const res = await node.run(
            {
                id: 'templateTransformAgentflow_0',
                inputs: {
                    templateTransformTemplate: '   ',
                    templateTransformVariables: [{ variableName: 'name', variableValue: 'ignored' }]
                }
            },
            '',
            baseOptions
        )

        expect(res.output.content).toBe('')
        expect(res.output._transformNotice).toContain('Template is empty')
    })
})
