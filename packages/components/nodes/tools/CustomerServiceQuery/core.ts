import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import axios from 'axios'

export type QueryMode = 'mock' | 'http'
export type QueryType = 'order' | 'logistics' | 'aftersales'

export interface QueryToolParams {
    mode: QueryMode
    orderApiUrl?: string
    logisticsApiUrl?: string
    aftersalesApiUrl?: string
    authHeaderValue?: string
    toolName?: string
    toolDescription?: string
}

const MAX_LEN = 2500
const truncate = (s: string, n = MAX_LEN): string => {
    const str = s || ''
    return str.length > n ? `${str.slice(0, n)}\n…（内容过长已截断）` : str
}

// 示例数据：不接后端时用于演示 / 跑通流程，结果里明确标注「示例数据」
export const mockResult = (type: QueryType, value: string): Record<string, any> => {
    if (type === 'logistics') {
        return {
            快递单号: value,
            承运商: '顺丰速运',
            状态: '运输中',
            最新轨迹: '[深圳] 您的快件已到达深圳集散中心，正在派往下一站',
            预计送达: '预计明天 18:00 前',
            说明: '（示例数据，仅供演示；接入真实接口请切换到「调用 API」模式）'
        }
    }
    if (type === 'aftersales') {
        return {
            订单号: value,
            售后类型: '退款',
            状态: '处理中',
            进度: '商家已收到退货，预计 1-2 个工作日完成退款',
            退款金额: '¥199.00',
            说明: '（示例数据，仅供演示；接入真实接口请切换到「调用 API」模式）'
        }
    }
    return {
        订单号: value,
        状态: '已发货',
        下单时间: '2026-06-01 14:23',
        支付金额: '¥199.00',
        商品: '示例商品 x1',
        收货人: '张**',
        物流单号: 'SF1234567890',
        说明: '（示例数据，仅供演示；接入真实接口请切换到「调用 API」模式）'
    }
}

const urlFor = (params: QueryToolParams, type: QueryType): string | undefined =>
    type === 'logistics' ? params.logisticsApiUrl : type === 'aftersales' ? params.aftersalesApiUrl : params.orderApiUrl

const typeLabel = (type: QueryType): string => (type === 'logistics' ? '物流' : type === 'aftersales' ? '退款/售后' : '订单')

// 拼最终 URL：有 {value} 占位就替换，否则把值追加到末尾
export const buildQueryUrl = (urlTemplate: string, value: string): string => {
    const enc = encodeURIComponent(value)
    return urlTemplate.includes('{value}') ? urlTemplate.replace(/\{value\}/g, enc) : `${urlTemplate}${enc}`
}

export const createQueryTool = (params: QueryToolParams): DynamicStructuredTool => {
    const schema = z.object({
        queryType: z
            .enum(['order', 'logistics', 'aftersales'])
            .describe('查询类型：order=订单详情/状态，logistics=物流快递跟踪，aftersales=退款/售后进度'),
        queryValue: z.string().describe('查询关键值：订单号或快递单号（必须由用户提供，不要编造）')
    })

    return new DynamicStructuredTool({
        name: params.toolName || 'customer_service_query',
        schema,
        description:
            params.toolDescription ||
            '查询订单详情/状态、物流快递跟踪、退款/售后进度。当用户询问「我的订单/快递/退款到哪了」时调用。调用前必须先向用户拿到订单号或快递单号，不要编造单号。',
        func: async ({ queryType, queryValue }) => {
            const val = (queryValue || '').trim()
            if (!val) return '请先向用户索取订单号或快递单号，拿到后再调用本工具查询，不要编造单号。'

            if (params.mode === 'http') {
                const url = urlFor(params, queryType)
                if (!url) {
                    return `未配置${typeLabel(queryType)}查询接口地址。请在「客服查询」节点里填写对应 API，或切换到「示例数据」模式。`
                }
                try {
                    const finalUrl = buildQueryUrl(url, val)
                    const headers: Record<string, string> = {}
                    if (params.authHeaderValue) headers.Authorization = params.authHeaderValue
                    const resp = await axios.get(finalUrl, { headers, timeout: 15000 })
                    const data = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data, null, 2)
                    return `${typeLabel(queryType)}查询结果：\n${truncate(data)}`
                } catch (e: any) {
                    const detail = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || String(e)
                    return `${typeLabel(queryType)}查询失败：${detail}。请确认单号是否正确，或提示用户稍后重试。`
                }
            }

            // 示例数据模式
            return `${typeLabel(queryType)}查询结果（示例数据）：\n${JSON.stringify(mockResult(queryType, val), null, 2)}`
        }
    })
}
