const mockAxiosPost = jest.fn()
jest.mock('axios', () => ({
    __esModule: true,
    default: { post: (...args: any[]) => mockAxiosPost(...args) }
}))

const { ContentSafetyModerationRunner } = require('./ContentSafetyModerationRunner')

const run = (params: Record<string, any>, input: string) => new ContentSafetyModerationRunner(params).checkForViolations(input)

describe('ContentSafetyModeration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    })

    afterEach(() => jest.restoreAllMocks())

    it('local 模式命中敏感词并 block 时抛出中文提示', async () => {
        await expect(
            run(
                {
                    moderationMode: 'local',
                    sensitiveWords: '敏感词,违禁',
                    onViolation: 'block',
                    moderationErrorMessage: '您的内容包含敏感信息，已被拦截。'
                },
                '这里包含敏感词'
            )
        ).rejects.toThrow('您的内容包含敏感信息，已被拦截。')
    })

    it('local 模式命中敏感词并 mask 时返回脱敏文本', async () => {
        const result = await run(
            {
                moderationMode: 'local',
                sensitiveWords: '敏感词\n违禁',
                onViolation: 'mask'
            },
            '这是一段敏感词，也包含违禁内容'
        )

        expect(result).toBe('这是一段***，也包含***内容')
    })

    it('local 模式未命中时原样返回', async () => {
        const input = '正常业务咨询'
        await expect(run({ moderationMode: 'local', sensitiveWords: '敏感词' }, input)).resolves.toBe(input)
    })

    it('local 模式 customRegex 命中后按配置处理', async () => {
        await expect(
            run(
                {
                    moderationMode: 'local',
                    customRegex: '1[3-9]\\d{9}',
                    onViolation: 'block',
                    moderationErrorMessage: '手机号不允许出现在输出中'
                },
                '请联系 13800138000'
            )
        ).rejects.toThrow('手机号不允许出现在输出中')
    })

    it('mock 模式命中内置示例词', async () => {
        await expect(run({ moderationMode: 'mock', onViolation: 'block' }, '这里有测试敏感词')).rejects.toThrow(
            '您的内容包含敏感信息，已被拦截。'
        )
    })

    it('http 模式风险响应按 onViolation 脱敏，并带 Authorization 头', async () => {
        mockAxiosPost.mockResolvedValue({ data: { risk: true, hits: ['敏感片段'] } })

        const result = await run(
            {
                moderationMode: 'http',
                apiUrl: 'https://safe.example.com/moderate',
                authHeaderValue: 'Bearer token',
                onViolation: 'mask'
            },
            '这是一段敏感片段'
        )

        expect(mockAxiosPost).toHaveBeenCalledWith(
            'https://safe.example.com/moderate',
            { text: '这是一段敏感片段' },
            { headers: { Authorization: 'Bearer token' }, timeout: 15000 }
        )
        expect(result).toBe('这是一段***')
    })

    it('http 模式网络异常安全放行，不抛错', async () => {
        mockAxiosPost.mockRejectedValue({ message: 'timeout' })

        await expect(
            run(
                {
                    moderationMode: 'http',
                    apiUrl: 'https://safe.example.com/moderate',
                    onViolation: 'block'
                },
                '原始内容'
            )
        ).resolves.toBe('原始内容')
    })

    it('节点形态：Moderation 分类，baseClasses 含 Moderation，凭证可选', () => {
        const { nodeClass: ContentSafetyModeration } = require('./ContentSafetyModeration')
        const node = new ContentSafetyModeration()

        expect(node.label).toBe('内容安全审核')
        expect(node.name).toBe('contentSafetyModeration')
        expect(node.category).toBe('Moderation')
        expect(node.baseClasses).toContain('Moderation')
        expect(node.credential.credentialNames).toContain('contentSafetyApi')
        expect(node.credential.optional).toBe(true)
        expect(node.inputs.map((i: any) => i.name)).toEqual(
            expect.arrayContaining([
                'moderationMode',
                'sensitiveWords',
                'customRegex',
                'apiUrl',
                'onViolation',
                'moderationErrorMessage'
            ])
        )
    })
})
