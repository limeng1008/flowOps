import fs from 'fs'
import path from 'path'

const templatePath = path.join(__dirname, '../../../marketplaces/agentflowsv2/营销文案生成智能体.json')

describe('Marketing Copy Agent marketplace template', () => {
    it('ships a Chinese AgentflowV2 template for generating marketing copy with a domestic model', () => {
        expect(fs.existsSync(templatePath)).toBe(true)

        const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'))

        expect(template.description).toContain('营销文案')
        expect(template.usecases).toEqual(['Agent', '营销'])
        expect(template.nodes.map((node: any) => node.data.name)).toEqual(['startAgentflow', 'llmAgentflow', 'stickyNoteAgentflow'])
        expect(template.edges).toHaveLength(1)

        const startNode = template.nodes.find((node: any) => node.id === 'startAgentflow_0')
        expect(startNode.data.inputs.startInputType).toBe('formInput')
        expect(startNode.data.inputs.formTitle).toBe('营销文案生成智能体')
        expect(startNode.data.inputs.formInputTypes.map((input: any) => input.name)).toEqual([
            'product',
            'sellingPoints',
            'audience',
            'channel',
            'tone',
            'variantCount'
        ])

        const llmNode = template.nodes.find((node: any) => node.id === 'llmAgentflow_0')
        expect(llmNode.data.inputs.llmModel).toBe('chatZhipuAI')
        expect(llmNode.data.inputs.llmModelConfig.modelName).toBe('glm-4.5')
        expect(llmNode.data.inputs.llmReturnResponseAs).toBe('userMessage')
        expect(llmNode.data.inputs.llmStructuredOutput.map((field: any) => field.key)).toEqual([
            'campaignTheme',
            'variants',
            'hashtags',
            'abTestTips'
        ])

        // every {{ $form.X }} mention in the prompt must map to a declared form field (AgentflowV2 uses $form.* for form inputs)
        const formVars = startNode.data.inputs.formInputTypes.map((input: any) => input.name)
        const userContent = llmNode.data.inputs.llmMessages.find((message: any) => message.role === 'user').content
        const mentioned = [...userContent.matchAll(/data-id="([^"]+)"/g)].map((match: any) => match[1].replace(/^\$form\./, ''))
        expect(userContent).toContain('$form.')
        expect(mentioned.length).toBeGreaterThan(0)
        for (const variable of mentioned) {
            expect(formVars).toContain(variable)
        }
    })
})
