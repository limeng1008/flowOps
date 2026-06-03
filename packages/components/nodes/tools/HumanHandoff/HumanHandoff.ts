import { INode, INodeData, INodeParams, ICommonObject } from '../../../src/Interface'
import { getCredentialData, getCredentialParam } from '../../../src/utils'
import { createHandoffTool, HandoffPlatform } from './core'

class HumanHandoff_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    credential: INodeParams

    constructor() {
        this.label = '转接人工坐席（企业微信/飞书）'
        this.name = 'humanHandoff'
        this.version = 1.0
        this.type = 'HumanHandoff'
        this.icon = 'humanhandoff.svg'
        this.category = 'Tools'
        this.description = '转人工时把会话历史推送到企业微信/飞书群机器人，由人工坐席接手。作为工具给智能体（Tool Agent）自主调用'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['imBotWebhook']
        }
        this.inputs = [
            {
                label: '平台',
                name: 'platform',
                type: 'options',
                options: [
                    { label: '企业微信', name: 'wecom' },
                    { label: '飞书', name: 'feishu' }
                ],
                default: 'wecom'
            },
            {
                label: '消息标题',
                name: 'sessionLabel',
                type: 'string',
                default: 'AI 客服转人工',
                description: '推送到坐席群的消息标题前缀',
                optional: true
            },
            {
                label: '工具名称',
                name: 'toolName',
                type: 'string',
                default: 'human_handoff',
                description: '智能体看到的工具名（建议英文 + 下划线）',
                optional: true,
                additionalParams: true
            },
            {
                label: '工具描述（触发时机）',
                name: 'toolDescription',
                type: 'string',
                rows: 3,
                description: '告诉智能体什么时候该调用本工具转人工；留空使用默认（知识库未覆盖/用户要求/订单支付投诉等）',
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const platform = ((nodeData.inputs?.platform as string) || 'wecom') as HandoffPlatform
        const sessionLabel = nodeData.inputs?.sessionLabel as string
        const toolName = nodeData.inputs?.toolName as string
        const toolDescription = nodeData.inputs?.toolDescription as string

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const webhookUrl = getCredentialParam('webhookUrl', credentialData, nodeData)
        const feishuSecret = getCredentialParam('feishuSecret', credentialData, nodeData)

        // 运行时完整对话历史（用户 + 客服双方），Agent 在初始化工具时透传 options
        const chatHistory = (options?.agentflowRuntime?.chatHistory as any[]) ?? []

        return createHandoffTool({ platform, webhookUrl, feishuSecret, toolName, toolDescription, sessionLabel, chatHistory })
    }
}

module.exports = { nodeClass: HumanHandoff_Tools }
