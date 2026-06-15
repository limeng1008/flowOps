import { createFeishuHandoffChatflowTemplate } from './feishuHandoffTemplate'

describe('Feishu handoff chatflow template', () => {
    it('creates a Tool Agent chatflow with Feishu human handoff wired as a tool', () => {
        const template = createFeishuHandoffChatflowTemplate()

        const humanHandoff = template.nodes.find((node) => node.data.name === 'humanHandoff')
        const toolAgent = template.nodes.find((node) => node.data.name === 'toolAgent')

        expect(humanHandoff).toBeTruthy()
        expect(humanHandoff.data.inputs.platform).toBe('feishu')
        expect(humanHandoff.data.inputParams[0].credentialNames).toContain('imBotWebhook')
        expect(toolAgent.data.inputs.tools).toContain('{{humanHandoff_0.data.instance}}')
        expect(toolAgent.data.inputAnchors.map((inputAnchor) => inputAnchor.name)).toEqual([
            'tools',
            'memory',
            'model',
            'chatPromptTemplate',
            'inputModeration'
        ])
        expect(toolAgent.data.inputs.chatPromptTemplate).toBe('')
        expect(toolAgent.data.inputs.inputModeration).toBe('')
        expect(template.edges).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    source: 'humanHandoff_0',
                    target: 'toolAgent_0',
                    targetHandle: 'toolAgent_0-input-tools-Tool'
                })
            ])
        )
    })

    it('includes setup guidance for configuring the model and Feishu bot credential', () => {
        const template = createFeishuHandoffChatflowTemplate()
        const note = template.nodes.find((node) => node.data.name === 'stickyNote').data.inputs.note

        expect(note).toContain('飞书')
        expect(note).toContain('Webhook')
        expect(note).toContain('模型凭证')
    })
})
