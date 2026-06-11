import fs from 'fs'
import os from 'os'
import path from 'path'

const { nodeClass: ParameterExtractor } = require('./ParameterExtractor')

const writeModelFixture = (body: string): string => {
    const fixturePath = path.join(os.tmpdir(), `flowops-parameter-extractor-${Date.now()}-${Math.random()}.js`)
    fs.writeFileSync(fixturePath, body)
    return fixturePath
}

const baseOptions = (filePath: string) => ({
    agentflowRuntime: { state: { kept: true } },
    componentNodes: {
        fakeChatModel: {
            label: 'Fake Chat Model',
            name: 'fakeChatModel',
            category: 'Chat Models',
            filePath
        },
        llamaIndexChatModel: {
            label: 'LlamaIndex Chat Model',
            name: 'llamaIndexChatModel',
            category: 'Chat Models',
            tags: ['LlamaIndex'],
            filePath
        }
    }
})

const parameterRows = [
    { parameterName: 'orderNo', parameterType: 'string', parameterDescription: 'Order number', parameterRequired: true },
    { parameterName: 'amount', parameterType: 'number', parameterDescription: 'Order amount', parameterRequired: true },
    { parameterName: 'isVip', parameterType: 'boolean', parameterDescription: 'Whether the customer is VIP', parameterRequired: false },
    { parameterName: 'tags', parameterType: 'array', parameterDescription: 'Matched labels', parameterRequired: false }
]

describe('ParameterExtractor agentflow node', () => {
    beforeEach(() => {
        ;(globalThis as any).__parameterExtractorStructuredCall = undefined
        ;(globalThis as any).__parameterExtractorMessages = undefined
    })

    it('is an Agent Flows node with model/input/parameters/instructions inputs', async () => {
        const node = new ParameterExtractor()
        expect(node.label).toBe('Parameter Extractor')
        expect(node.name).toBe('parameterExtractorAgentflow')
        expect(node.category).toBe('Agent Flows')
        expect(node.icon).toBe('parameterextractor.svg')
        expect(fs.existsSync(path.join(__dirname, node.icon))).toBe(true)
        expect(node.inputs.map((i: any) => i.name)).toEqual(
            expect.arrayContaining([
                'parameterExtractorModel',
                'parameterExtractorInput',
                'parameterExtractorParameters',
                'parameterExtractorInstructions'
            ])
        )

        const options = await node.loadMethods.listModels({} as any, baseOptions('/tmp/fake.js') as any)
        expect(options).toEqual([{ label: 'Fake Chat Model', name: 'fakeChatModel', imageSrc: undefined }])
    })

    it('extracts configured parameters through configureStructuredOutput', async () => {
        const fixturePath = writeModelFixture(`
            class FakeModelNode {
                async init() {
                    return {
                        withStructuredOutput(schema, options) {
                            globalThis.__parameterExtractorStructuredCall = { schema, options }
                            return {
                                async invoke(messages) {
                                    globalThis.__parameterExtractorMessages = messages
                                    return { content: { orderNo: 'A123', amount: 88.5, isVip: true, tags: ['urgent'] } }
                                }
                            }
                        }
                    }
                }
            }
            module.exports = { nodeClass: FakeModelNode }
        `)
        const node = new ParameterExtractor()

        const res = await node.run(
            {
                id: 'parameterExtractorAgentflow_0',
                inputs: {
                    parameterExtractorModel: 'fakeChatModel',
                    parameterExtractorModelConfig: {},
                    parameterExtractorInput: '订单 A123，金额 88.5，VIP 客户',
                    parameterExtractorParameters: parameterRows,
                    parameterExtractorInstructions: 'Prefer values explicitly present in the input.'
                }
            },
            '',
            baseOptions(fixturePath) as any
        )

        expect((globalThis as any).__parameterExtractorStructuredCall.options).toEqual({ method: 'functionCalling' })
        expect((globalThis as any).__parameterExtractorMessages[0].role).toBe('system')
        expect((globalThis as any).__parameterExtractorMessages[1]).toEqual({
            role: 'user',
            content: '订单 A123，金额 88.5，VIP 客户'
        })
        expect(res.output.content).toEqual({ orderNo: 'A123', amount: 88.5, isVip: true, tags: ['urgent'] })
        expect(res.output.orderNo).toBe('A123')
        expect(res.output.amount).toBe(88.5)
        expect(res.state).toEqual({ kept: true })
    })

    it('fills missing required values with null and reports an extraction error', async () => {
        const fixturePath = writeModelFixture(`
            class FakeModelNode {
                async init() {
                    return {
                        withStructuredOutput() {
                            return {
                                async invoke() {
                                    return { content: { amount: 12 } }
                                }
                            }
                        }
                    }
                }
            }
            module.exports = { nodeClass: FakeModelNode }
        `)
        const node = new ParameterExtractor()

        const res = await node.run(
            {
                id: 'parameterExtractorAgentflow_0',
                inputs: {
                    parameterExtractorModel: 'fakeChatModel',
                    parameterExtractorInput: '金额 12，缺少订单号',
                    parameterExtractorParameters: parameterRows
                }
            },
            '',
            baseOptions(fixturePath) as any
        )

        expect(res.output.content.orderNo).toBeNull()
        expect(res.output.content.amount).toBe(12)
        expect(res.output._extractionError).toContain('orderNo')
    })

    it('does not throw when the model call fails', async () => {
        const fixturePath = writeModelFixture(`
            class FakeModelNode {
                async init() {
                    return {
                        withStructuredOutput() {
                            return {
                                async invoke() {
                                    throw new Error('upstream unavailable')
                                }
                            }
                        }
                    }
                }
            }
            module.exports = { nodeClass: FakeModelNode }
        `)
        const node = new ParameterExtractor()

        await expect(
            node.run(
                {
                    id: 'parameterExtractorAgentflow_0',
                    inputs: {
                        parameterExtractorModel: 'fakeChatModel',
                        parameterExtractorInput: '订单内容',
                        parameterExtractorParameters: parameterRows
                    }
                },
                '',
                baseOptions(fixturePath) as any
            )
        ).resolves.toMatchObject({
            output: {
                content: { orderNo: null, amount: null, isVip: null, tags: null },
                _extractionError: expect.stringContaining('upstream unavailable')
            }
        })
    })
})
