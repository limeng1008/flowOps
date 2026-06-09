import fs from 'fs'
import path from 'path'

const templateDir = path.join(__dirname, '../../../marketplaces/agentflowsv2')
const marketplaceI18nPath = path.join(__dirname, '../../../../ui/src/i18n/marketplaceI18n.js')

const loadTemplate = (file: string) => {
    const templatePath = path.join(templateDir, file)
    expect(fs.existsSync(templatePath)).toBe(true)
    return JSON.parse(fs.readFileSync(templatePath, 'utf8'))
}

const nodeById = (template: any, id: string) => template.nodes.find((node: any) => node.id === id)
const edgePairs = (template: any) => template.edges.map((edge: any) => `${edge.source}->${edge.target}`)

describe('Trigger activation AgentflowV2 marketplace templates', () => {
    it('ships a scheduled daily operations report template', () => {
        const template = loadTemplate('定时运营日报.json')

        expect(template.description).toContain('daily operations report')
        expect(template.description).toContain('09:00 Asia/Shanghai')
        expect(template.usecases).toEqual(['Agent', '自动化', '办公'])
        expect(template.nodes.map((node: any) => node.data.name)).toEqual([
            'startAgentflow',
            'httpAgentflow',
            'llmAgentflow',
            'documentExportAgentflow',
            'stickyNoteAgentflow'
        ])
        expect(edgePairs(template)).toEqual([
            'startAgentflow_0->httpAgentflow_0',
            'httpAgentflow_0->llmAgentflow_0',
            'llmAgentflow_0->documentExportAgentflow_0'
        ])

        const startNode = nodeById(template, 'startAgentflow_0')
        expect(startNode.data.inputs.startInputType).toBe('scheduleInput')
        expect(startNode.data.inputs.scheduleType).toBe('cronExpression')
        expect(startNode.data.inputs.scheduleCronExpression).toBe('0 9 * * *')
        expect(startNode.data.inputs.scheduleTimezone).toBe('Asia/Shanghai')
        expect(startNode.data.inputs.scheduleInputMode).toBe('text')
        expect(startNode.data.inputs.scheduleDefaultInput).toContain('运营日报')

        const httpNode = nodeById(template, 'httpAgentflow_0')
        expect(httpNode.data.inputs.method).toBe('GET')
        expect(httpNode.data.inputs.url).toContain('example.com')

        const llmNode = nodeById(template, 'llmAgentflow_0')
        expect(llmNode.data.inputs.llmModel).toBe('chatZhipuAI')
        expect(llmNode.data.inputs.llmModelConfig.modelName).toBe('glm-4.5')
        expect(llmNode.data.inputs.llmMessages.map((message: any) => message.content).join('\n')).toContain('{{ httpAgentflow_0 }}')

        const exportNode = nodeById(template, 'documentExportAgentflow_0')
        expect(exportNode.data.inputs.docExportContent).toContain('{{ llmAgentflow_0 }}')
        expect(exportNode.data.inputs.docExportFormat).toBe('docx')
    })

    it('ships a scheduled data sync reminder template', () => {
        const template = loadTemplate('定时数据同步提醒.json')

        expect(template.description).toContain('data sync')
        expect(template.description).toContain('hourly')
        expect(template.usecases).toEqual(['Agent', '自动化', '运维'])
        expect(template.nodes.map((node: any) => node.data.name)).toEqual([
            'startAgentflow',
            'httpAgentflow',
            'conditionAgentflow',
            'httpAgentflow',
            'stickyNoteAgentflow'
        ])
        expect(edgePairs(template)).toEqual([
            'startAgentflow_0->httpAgentflow_0',
            'httpAgentflow_0->conditionAgentflow_0',
            'conditionAgentflow_0->httpAgentflow_1'
        ])

        const startNode = nodeById(template, 'startAgentflow_0')
        expect(startNode.data.inputs.startInputType).toBe('scheduleInput')
        expect(startNode.data.inputs.scheduleType).toBe('cronExpression')
        expect(startNode.data.inputs.scheduleCronExpression).toBe('0 * * * *')
        expect(startNode.data.inputs.scheduleTimezone).toBe('Asia/Shanghai')

        const conditionNode = nodeById(template, 'conditionAgentflow_0')
        expect(conditionNode.data.inputs.conditions[0].value1).toContain('{{ httpAgentflow_0 }}')
        expect(conditionNode.data.inputs.conditions[0].operation).toBe('notContains')

        const notifyNode = nodeById(template, 'httpAgentflow_1')
        expect(notifyNode.data.inputs.method).toBe('POST')
        expect(notifyNode.data.inputs.body).toContain('{{ httpAgentflow_0 }}')
    })

    it('ships a webhook order intake automation template', () => {
        const template = loadTemplate('Webhook 接单自动处理.json')

        expect(template.description).toContain('order webhooks')
        expect(template.description).toContain('synchronous JSON')
        expect(template.usecases).toEqual(['Agent', '自动化', 'Webhook'])
        expect(template.nodes.map((node: any) => node.data.name)).toEqual([
            'startAgentflow',
            'llmAgentflow',
            'directReplyAgentflow',
            'stickyNoteAgentflow'
        ])
        expect(edgePairs(template)).toEqual(['startAgentflow_0->llmAgentflow_0', 'llmAgentflow_0->directReplyAgentflow_0'])

        const startNode = nodeById(template, 'startAgentflow_0')
        expect(startNode.data.inputs.startInputType).toBe('webhookTrigger')
        expect(startNode.data.inputs.webhookMethod).toBe('POST')
        expect(startNode.data.inputs.webhookContentType).toBe('application/json')
        expect(startNode.data.inputs.webhookResponseMode).toBe('sync')
        expect(startNode.data.inputs.webhookDefaultInput).toContain('$webhook.body')

        const llmNode = nodeById(template, 'llmAgentflow_0')
        expect(llmNode.data.inputs.llmModel).toBe('chatZhipuAI')
        expect(llmNode.data.inputs.llmModelConfig.modelName).toBe('glm-4.5')
        expect(llmNode.data.inputs.llmMessages.map((message: any) => message.content).join('\n')).toContain('$webhook.body')

        const replyNode = nodeById(template, 'directReplyAgentflow_0')
        expect(replyNode.data.inputs.directReplyMessage).toContain('{{ llmAgentflow_0 }}')
    })

    it('registers Chinese marketplace labels without changing template JSON names', () => {
        const source = fs.readFileSync(marketplaceI18nPath, 'utf8')
        for (const name of ['定时运营日报', '定时数据同步提醒', 'Webhook 接单自动处理']) {
            expect(source).toMatch(new RegExp(`['"]?${name}['"]?:\\s*'${name}'`))
        }
        expect(source).toContain("'Automate a daily operations report on a 09:00 Asia/Shanghai cron schedule'")
        expect(source).toContain("'每日上午 9 点（Asia/Shanghai）自动拉取运营数据、总结日报并导出文档'")
    })
})
