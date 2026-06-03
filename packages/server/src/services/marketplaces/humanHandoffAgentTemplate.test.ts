import fs from 'fs'
import path from 'path'

const templatePath = path.join(__dirname, '../../../marketplaces/agentflowsv2/转人工客服智能体.json')

describe('Human Handoff customer-service agent marketplace template', () => {
    it('ships an AgentflowV2 客服 template that hands off to 企业微信/飞书 with history', () => {
        expect(fs.existsSync(templatePath)).toBe(true)

        const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'))

        expect(template.description).toContain('转人工')
        expect(template.usecases).toEqual(['Agent', '客服'])

        // Start -> Agent，含说明贴纸
        expect(template.nodes.map((n: any) => n.data.name)).toEqual(
            expect.arrayContaining(['startAgentflow', 'agentAgentflow', 'stickyNoteAgentflow'])
        )
        expect(template.edges.map((e: any) => `${e.source}->${e.target}`)).toEqual(['startAgentflow_0->agentAgentflow_0'])

        const agent = template.nodes.find((n: any) => n.id === 'agentAgentflow_0')
        expect(agent.data.inputs.agentModel).toBe('chatZhipuAI')
        expect(agent.data.inputs.agentModelConfig.modelName).toBe('glm-4.5')
        expect(agent.data.inputs.agentEnableMemory).toBe(true) // 有记忆，才能带完整历史

        // 转人工工具已接入 Agent
        const tools = agent.data.inputs.agentTools
        expect(Array.isArray(tools)).toBe(true)
        const handoff = tools.find((t: any) => t.agentSelectedTool === 'humanHandoff')
        expect(handoff).toBeTruthy()
        expect(handoff.agentSelectedToolConfig.agentSelectedTool).toBe('humanHandoff')
        expect(['wecom', 'feishu']).toContain(handoff.agentSelectedToolConfig.platform)
        expect(handoff.agentSelectedToolConfig).toHaveProperty('credential') // 凭证占位，导入后填

        // 系统提示词指导：何时转人工 + 必须带完整历史进 conversationSummary
        const systemPrompt = agent.data.inputs.agentMessages.map((m: any) => m.content).join('\n')
        expect(systemPrompt).toContain('human_handoff')
        expect(systemPrompt).toContain('conversationSummary')
        expect(systemPrompt).toContain('转人工')

        // 知识库留空，导入后由用户选择自己的文档库
        expect(agent.data.inputs.agentKnowledgeDocumentStores).toBe('')

        // 贴纸给出配置指引
        const note = template.nodes.find((n: any) => n.id === 'stickyNoteAgentflow_0')
        expect(note.data.inputs.note).toContain('知识库')
        expect(note.data.inputs.note).toContain('Webhook')
    })
})
