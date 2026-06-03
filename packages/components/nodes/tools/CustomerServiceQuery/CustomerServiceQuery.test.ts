const mockAxiosGet = jest.fn()
jest.mock('axios', () => ({
    __esModule: true,
    default: { get: (...args: any[]) => mockAxiosGet(...args) }
}))

const { createQueryTool, buildQueryUrl } = require('./core')

const invoke = (tool: any, args: any) => tool.invoke(args)

describe('CustomerServiceQuery tool (订单/物流/售后)', () => {
    beforeEach(() => jest.clearAllMocks())

    it('示例数据：订单查询返回状态等，且标注示例数据，不发网络', async () => {
        const tool = createQueryTool({ mode: 'mock' })
        const res = await invoke(tool, { queryType: 'order', queryValue: 'A123' })
        expect(res).toContain('订单')
        expect(res).toContain('A123')
        expect(res).toContain('状态')
        expect(res).toContain('示例数据')
        expect(mockAxiosGet).not.toHaveBeenCalled()
    })

    it('示例数据：物流与售后各有对应字段', async () => {
        const tool = createQueryTool({ mode: 'mock' })
        const logi = await invoke(tool, { queryType: 'logistics', queryValue: 'SF999' })
        expect(logi).toContain('物流')
        expect(logi).toContain('最新轨迹')
        const after = await invoke(tool, { queryType: 'aftersales', queryValue: 'A123' })
        expect(after).toContain('退款')
        expect(after).toContain('进度')
    })

    it('调用 API：按 queryType 选 URL、替换 {value}、带鉴权头', async () => {
        mockAxiosGet.mockResolvedValue({ data: { 状态: '已签收' } })
        const tool = createQueryTool({
            mode: 'http',
            orderApiUrl: 'https://api.x.com/order?no={value}',
            logisticsApiUrl: 'https://api.x.com/logi?no={value}',
            authHeaderValue: 'Bearer tok'
        })
        const res = await invoke(tool, { queryType: 'order', queryValue: 'A 1' })
        const [url, cfg] = mockAxiosGet.mock.calls[0]
        expect(url).toBe('https://api.x.com/order?no=A%201') // 选订单 URL + encode
        expect(cfg.headers.Authorization).toBe('Bearer tok')
        expect(res).toContain('已签收')
    })

    it('调用 API：未配置该类型 URL → 提示去配置', async () => {
        const tool = createQueryTool({ mode: 'http', orderApiUrl: 'https://api.x.com/order?no={value}' })
        const res = await invoke(tool, { queryType: 'logistics', queryValue: 'SF1' })
        expect(res).toContain('未配置')
        expect(mockAxiosGet).not.toHaveBeenCalled()
    })

    it('调用 API：请求异常 → 返回失败提示而非抛错', async () => {
        mockAxiosGet.mockRejectedValue({ message: 'timeout' })
        const tool = createQueryTool({ mode: 'http', orderApiUrl: 'https://api.x.com/order?no={value}' })
        const res = await invoke(tool, { queryType: 'order', queryValue: 'A1' })
        expect(res).toContain('失败')
        expect(res).toContain('timeout')
    })

    it('空单号：提示先索取单号、不查询、不编造', async () => {
        const tool = createQueryTool({ mode: 'mock' })
        const res = await invoke(tool, { queryType: 'order', queryValue: '   ' })
        expect(res).toContain('索取')
        expect(mockAxiosGet).not.toHaveBeenCalled()
    })

    it('buildQueryUrl：有占位则替换，无占位则追加', () => {
        expect(buildQueryUrl('https://x.com/o?no={value}', 'A B')).toBe('https://x.com/o?no=A%20B')
        expect(buildQueryUrl('https://x.com/o/', 'A B')).toBe('https://x.com/o/A%20B')
    })

    it('节点形态：Tools 分类的 Tool，凭证可选', () => {
        const { nodeClass: CustomerServiceQuery } = require('./CustomerServiceQuery')
        const node = new CustomerServiceQuery()
        expect(node.name).toBe('customerServiceQuery')
        expect(node.category).toBe('Tools')
        expect(node.baseClasses).toContain('Tool')
        expect(node.credential.optional).toBe(true)
        expect(node.inputs.map((i: any) => i.name)).toEqual(
            expect.arrayContaining(['queryMode', 'orderApiUrl', 'logisticsApiUrl', 'aftersalesApiUrl'])
        )
    })
})
