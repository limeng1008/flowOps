import fs from 'fs'
import path from 'path'

const templatePath = path.join(__dirname, '../../../marketplaces/agentflowsv2/Excel 表格生成智能体.json')

describe('Excel Table Agent marketplace template', () => {
    it('ships a complete AgentflowV2 template that generates xlsx downloads through SpreadsheetExport', () => {
        expect(fs.existsSync(templatePath)).toBe(true)

        const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'))

        expect(template.description).toContain('Excel')
        expect(template.description).toContain('表格')
        expect(template.usecases).toEqual(['Agent', '办公'])
        expect(template.nodes.map((node: any) => node.data.name)).toEqual([
            'startAgentflow',
            'llmAgentflow',
            'spreadsheetExportAgentflow',
            'stickyNoteAgentflow'
        ])
        expect(template.edges.map((edge: any) => `${edge.source}->${edge.target}`)).toEqual([
            'startAgentflow_0->llmAgentflow_0',
            'llmAgentflow_0->spreadsheetExportAgentflow_0'
        ])

        const startNode = template.nodes.find((node: any) => node.id === 'startAgentflow_0')
        expect(startNode.data.inputs.startInputType).toBe('formInput')
        expect(startNode.data.inputs.formTitle).toBe('Excel 表格生成智能体')
        expect(startNode.data.inputs.formInputTypes.map((input: any) => input.name)).toEqual([
            'tablePurpose',
            'columns',
            'sourceData',
            'rowCount',
            'dataRules'
        ])

        const llmNode = template.nodes.find((node: any) => node.id === 'llmAgentflow_0')
        expect(llmNode.data.label).toBe('Excel 表格数据生成')
        expect(llmNode.data.inputs.llmModel).toBe('chatZhipuAI')
        expect(llmNode.data.inputs.llmModelConfig.modelName).toBe('glm-4.5')
        expect(llmNode.data.inputs.llmReturnResponseAs).toBe('userMessage')
        expect(llmNode.data.inputs.llmStructuredOutput).toBe('')

        const prompt = llmNode.data.inputs.llmMessages.map((message: any) => message.content).join('\n')
        expect(prompt).toContain('只输出合法 JSON 数组')
        expect(prompt).toContain('不要 Markdown')
        expect(prompt).toContain('对象数组或二维数组')

        const formVars = startNode.data.inputs.formInputTypes.map((input: any) => input.name)
        const mentioned = [...prompt.matchAll(/data-id="([^"]+)"/g)].map((match: any) => match[1].replace(/^\$form\./, ''))
        expect(prompt).toContain('$form.')
        expect(mentioned.length).toBeGreaterThan(0)
        for (const variable of mentioned) {
            expect(formVars).toContain(variable)
        }

        const spreadsheetNode = template.nodes.find((node: any) => node.id === 'spreadsheetExportAgentflow_0')
        expect(spreadsheetNode.data.label).toBe('表格导出')
        expect(spreadsheetNode.data.name).toBe('spreadsheetExportAgentflow')
        expect(spreadsheetNode.data.inputs.docExportContent).toContain('{{ llmAgentflow_0 }}')
        expect(spreadsheetNode.data.inputs.sheetName).toBe('数据表')
        expect(spreadsheetNode.data.inputs.docExportFileName).toBe('excel-table')

        const stickyNote = template.nodes.find((node: any) => node.id === 'stickyNoteAgentflow_0')
        expect(stickyNote.type).toBe('stickyNote')
        expect(stickyNote.data.inputs.note).toContain('.xlsx')
    })
})
