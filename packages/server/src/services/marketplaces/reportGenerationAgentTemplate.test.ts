import fs from 'fs'
import path from 'path'

const templatePath = path.join(__dirname, '../../../marketplaces/agentflowsv2/报告生成智能体.json')

describe('Report Generation Agent marketplace template', () => {
    it('ships a Chinese AgentflowV2 template for generating workplace reports with guarded form variables', () => {
        expect(fs.existsSync(templatePath)).toBe(true)

        const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'))

        expect(template.description).toContain('报告')
        expect(template.usecases).toEqual(['Agent', '办公'])
        expect(template.nodes.map((node: any) => node.data.name)).toEqual(['startAgentflow', 'llmAgentflow', 'stickyNoteAgentflow'])
        expect(template.edges).toHaveLength(1)

        const startNode = template.nodes.find((node: any) => node.id === 'startAgentflow_0')
        expect(startNode.data.inputs.startInputType).toBe('formInput')
        expect(startNode.data.inputs.formTitle).toBe('报告生成智能体')
        expect(startNode.data.inputs.formInputTypes.map((input: any) => input.name)).toEqual([
            'reportType',
            'topic',
            'audience',
            'keyPoints',
            'period',
            'wordCount'
        ])
        expect(startNode.data.inputs.formInputTypes.map((input: any) => input.type)).toEqual([
            'string',
            'string',
            'string',
            'string',
            'string',
            'number'
        ])

        const llmNode = template.nodes.find((node: any) => node.id === 'llmAgentflow_0')
        expect(llmNode.data.inputs.llmModel).toBe('chatZhipuAI')
        expect(llmNode.data.inputs.llmModelConfig.modelName).toBe('glm-4.5')
        expect(llmNode.data.inputs.llmReturnResponseAs).toBe('userMessage')
        expect(llmNode.data.inputs.llmStructuredOutput.map((field: any) => field.key)).toEqual([
            'title',
            'summary',
            'sections',
            'nextSteps'
        ])

        const sectionsField = llmNode.data.inputs.llmStructuredOutput.find((field: any) => field.key === 'sections')
        expect(sectionsField.type).toBe('jsonArray')
        expect(sectionsField.jsonSchema).toContain('"heading"')
        expect(sectionsField.jsonSchema).toContain('"content"')
        expect(sectionsField.jsonSchema).toContain('"bullets"')

        const formVars = startNode.data.inputs.formInputTypes.map((input: any) => input.name)
        const userContent = llmNode.data.inputs.llmMessages.find((message: any) => message.role === 'user').content
        expect(userContent).toContain('$form.')

        const dataIds = [...userContent.matchAll(/data-id="([^"]+)"/g)].map((match: any) => match[1])
        const dataLabels = [...userContent.matchAll(/data-label="([^"]+)"/g)].map((match: any) => match[1])
        const curlyVariables = [...userContent.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)].map((match: any) => match[1])

        expect(dataIds).toHaveLength(formVars.length)
        expect(dataLabels).toEqual(dataIds)
        expect(curlyVariables).toEqual(dataIds)
        for (const variable of dataIds) {
            expect(variable).toMatch(/^\$form\./)
            expect(formVars).toContain(variable.replace(/^\$form\./, ''))
        }
    })
})
