const mockAxiosPost = jest.fn()
jest.mock('axios', () => ({
    __esModule: true,
    default: { post: (...args: any[]) => mockAxiosPost(...args) }
}))

const { createHandoffTool, feishuSign } = require('./core')

const invoke = (tool: any, args: any) => tool.invoke(args)

describe('HumanHandoff tool (企业微信 / 飞书 转人工)', () => {
    beforeEach(() => jest.clearAllMocks())

    it('企业微信：POST markdown，带上对话历史，返回成功提示', async () => {
        mockAxiosPost.mockResolvedValue({ data: { errcode: 0, errmsg: 'ok' } })
        const tool = createHandoffTool({
            platform: 'wecom',
            webhookUrl: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc',
            sessionLabel: 'AI客服转人工'
        })
        const res = await invoke(tool, {
            reason: '用户明确要求人工',
            conversationSummary: '用户咨询退款流程，机器人未能解决',
            customerQuestion: '我的订单怎么退款'
        })

        const [url, body] = mockAxiosPost.mock.calls[0]
        expect(url).toBe('https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc')
        expect(body.msgtype).toBe('markdown')
        expect(body.markdown.content).toContain('AI客服转人工')
        expect(body.markdown.content).toContain('用户明确要求人工') // reason
        expect(body.markdown.content).toContain('用户咨询退款流程') // 对话历史
        expect(body.markdown.content).toContain('我的订单怎么退款') // 当前问题
        expect(res).toContain('已将会话转接给企业微信')
    })

    it('飞书：配置 secret 时带签名，POST text，返回成功提示', async () => {
        mockAxiosPost.mockResolvedValue({ data: { code: 0 } })
        const tool = createHandoffTool({
            platform: 'feishu',
            webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/xyz',
            feishuSecret: 's3cr3t'
        })
        const res = await invoke(tool, { reason: '投诉', conversationSummary: '历史上下文文本' })

        const [url, body] = mockAxiosPost.mock.calls[0]
        expect(url).toBe('https://open.feishu.cn/open-apis/bot/v2/hook/xyz')
        expect(body.msg_type).toBe('text')
        expect(body.content.text).toContain('历史上下文文本')
        expect(typeof body.timestamp).toBe('string')
        expect(body.sign).toBe(feishuSign(body.timestamp, 's3cr3t')) // 签名算法一致
        expect(res).toContain('已将会话转接给飞书')
    })

    it('飞书：无 secret 时不带签名', async () => {
        mockAxiosPost.mockResolvedValue({ data: { code: 0 } })
        const tool = createHandoffTool({ platform: 'feishu', webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/xyz' })
        await invoke(tool, { reason: 'r', conversationSummary: 'h' })
        const [, body] = mockAxiosPost.mock.calls[0]
        expect(body.sign).toBeUndefined()
        expect(body.timestamp).toBeUndefined()
    })

    it('企业微信 errcode!=0：返回失败提示而不抛异常', async () => {
        mockAxiosPost.mockResolvedValue({ data: { errcode: 93000, errmsg: 'invalid webhook url' } })
        const tool = createHandoffTool({ platform: 'wecom', webhookUrl: 'https://qyapi.weixin.qq.com/x' })
        const res = await invoke(tool, { reason: 'r', conversationSummary: 'h' })
        expect(res).toContain('失败')
        expect(res).toContain('invalid webhook url')
    })

    it('网络异常：捕获并返回失败提示', async () => {
        mockAxiosPost.mockRejectedValue({ message: 'ECONNRESET' })
        const tool = createHandoffTool({ platform: 'feishu', webhookUrl: 'https://open.feishu.cn/x' })
        const res = await invoke(tool, { reason: 'r', conversationSummary: 'h' })
        expect(res).toContain('失败')
        expect(res).toContain('ECONNRESET')
    })

    it('未配置 webhook：直接提示且不发请求', async () => {
        const tool = createHandoffTool({ platform: 'wecom', webhookUrl: '' })
        const res = await invoke(tool, { reason: 'r', conversationSummary: 'h' })
        expect(res).toContain('未配置')
        expect(mockAxiosPost).not.toHaveBeenCalled()
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
