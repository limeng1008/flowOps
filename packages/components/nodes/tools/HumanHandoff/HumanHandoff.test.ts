const mockAxiosPost = jest.fn()
jest.mock('axios', () => ({
    __esModule: true,
    default: { post: (...args: any[]) => mockAxiosPost(...args) }
}))

const { createHandoffTool, feishuSign, formatChatHistory } = require('./core')

const invoke = (tool: any, args: any) => tool.invoke(args)

// 模拟 Agent 运行时传入的双方对话历史（IMessage：userMessage=用户，apiMessage=客服）
const convo = [
    { message: '你们怎么退款？', type: 'userMessage' },
    { message: '请问您的订单号是多少？', type: 'apiMessage' },
    { message: '我不想说，我要人工', type: 'userMessage' }
]

describe('HumanHandoff tool (企业微信 / 飞书 转人工)', () => {
    beforeEach(() => jest.clearAllMocks())

    it('企业微信：自动带上用户与客服双方完整对话，POST markdown，返回成功提示', async () => {
        mockAxiosPost.mockResolvedValue({ data: { errcode: 0, errmsg: 'ok' } })
        const tool = createHandoffTool({
            platform: 'wecom',
            webhookUrl: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc',
            sessionLabel: 'AI客服转人工',
            chatHistory: convo
        })
        const res = await invoke(tool, { reason: '用户明确要求人工', customerQuestion: '我要人工' })

        const [url, body] = mockAxiosPost.mock.calls[0]
        expect(url).toBe('https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc')
        expect(body.msgtype).toBe('markdown')
        const content = body.markdown.content
        expect(content).toContain('完整对话记录（用户 & 客服）')
        expect(content).toContain('用户：你们怎么退款？') // 用户那半边
        expect(content).toContain('客服：请问您的订单号是多少？') // 客服(智能体)那半边 —— 关键
        expect(content).toContain('用户明确要求人工') // reason
        expect(res).toContain('已将会话转接给企业微信')
    })

    it('飞书：带 secret 时签名，text 含双方对话', async () => {
        mockAxiosPost.mockResolvedValue({ data: { code: 0 } })
        const tool = createHandoffTool({
            platform: 'feishu',
            webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/xyz',
            feishuSecret: 's3cr3t',
            chatHistory: convo
        })
        const res = await invoke(tool, { reason: '投诉' })

        const [url, body] = mockAxiosPost.mock.calls[0]
        expect(url).toBe('https://open.feishu.cn/open-apis/bot/v2/hook/xyz')
        expect(body.msg_type).toBe('text')
        expect(body.content.text).toContain('用户：你们怎么退款？')
        expect(body.content.text).toContain('客服：请问您的订单号是多少？')
        expect(typeof body.timestamp).toBe('string')
        expect(body.sign).toBe(feishuSign(body.timestamp, 's3cr3t'))
        expect(res).toContain('已将会话转接给飞书')
    })

    it('飞书：无 secret 时不带签名', async () => {
        mockAxiosPost.mockResolvedValue({ data: { code: 0 } })
        const tool = createHandoffTool({
            platform: 'feishu',
            webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/xyz',
            chatHistory: convo
        })
        await invoke(tool, { reason: 'r' })
        const [, body] = mockAxiosPost.mock.calls[0]
        expect(body.sign).toBeUndefined()
        expect(body.timestamp).toBeUndefined()
    })

    it('无运行时历史时：退回使用 conversationSummary', async () => {
        mockAxiosPost.mockResolvedValue({ data: { errcode: 0 } })
        const tool = createHandoffTool({ platform: 'wecom', webhookUrl: 'https://qyapi.weixin.qq.com/x' }) // 不传 chatHistory
        await invoke(tool, { reason: '要人工', conversationSummary: '用户咨询退款，机器人未解决' })
        const [, body] = mockAxiosPost.mock.calls[0]
        expect(body.markdown.content).toContain('对话历史 / 上下文')
        expect(body.markdown.content).toContain('用户咨询退款，机器人未解决')
    })

    it('企业微信 errcode!=0：返回失败提示而不抛异常', async () => {
        mockAxiosPost.mockResolvedValue({ data: { errcode: 93000, errmsg: 'invalid webhook url' } })
        const tool = createHandoffTool({ platform: 'wecom', webhookUrl: 'https://qyapi.weixin.qq.com/x', chatHistory: convo })
        const res = await invoke(tool, { reason: 'r' })
        expect(res).toContain('失败')
        expect(res).toContain('invalid webhook url')
    })

    it('网络异常：捕获并返回失败提示', async () => {
        mockAxiosPost.mockRejectedValue({ message: 'ECONNRESET' })
        const tool = createHandoffTool({ platform: 'feishu', webhookUrl: 'https://open.feishu.cn/x', chatHistory: convo })
        const res = await invoke(tool, { reason: 'r' })
        expect(res).toContain('失败')
        expect(res).toContain('ECONNRESET')
    })

    it('未配置 webhook：直接提示且不发请求', async () => {
        const tool = createHandoffTool({ platform: 'wecom', webhookUrl: '' })
        const res = await invoke(tool, { reason: 'r' })
        expect(res).toContain('未配置')
        expect(mockAxiosPost).not.toHaveBeenCalled()
    })

    it('formatChatHistory：正确区分用户/客服并跳过空内容', () => {
        const text = formatChatHistory([
            { message: '问题一', type: 'userMessage' },
            { message: '回答一', type: 'apiMessage' },
            { message: '   ', type: 'userMessage' }, // 空内容跳过
            { content: '问题二', role: 'user' } // 兼容 role/content 形态
        ])
        expect(text).toBe('用户：问题一\n客服：回答一\n用户：问题二')
    })

    it('节点形态：是 Tools 分类的 Tool，带平台/凭证', () => {
        const { nodeClass: HumanHandoff } = require('./HumanHandoff')
        const node = new HumanHandoff()
        expect(node.name).toBe('humanHandoff')
        expect(node.category).toBe('Tools')
        expect(node.baseClasses).toContain('Tool')
        expect(node.credential.credentialNames).toContain('imBotWebhook')
        expect(node.inputs.map((i: any) => i.name)).toEqual(expect.arrayContaining(['platform', 'sessionLabel']))
    })
})
