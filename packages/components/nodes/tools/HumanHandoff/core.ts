import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import axios from 'axios'
import * as crypto from 'crypto'

export type HandoffPlatform = 'wecom' | 'feishu'

export interface HandoffToolParams {
    platform: HandoffPlatform
    webhookUrl: string
    feishuSecret?: string
    toolName?: string
    toolDescription?: string
    sessionLabel?: string
}

// 企业微信/飞书群机器人对消息体长度有限制，超长会被拒收，这里整理后截断。
const MAX_LEN = 3500
const truncate = (s: string, n = MAX_LEN): string => {
    const str = s || ''
    return str.length > n ? `${str.slice(0, n)}\n…（内容过长已截断）` : str
}

const platformName = (platform: HandoffPlatform): string => (platform === 'feishu' ? '飞书' : '企业微信')

// 把转接信息拼成一段人工坐席可读的纯文本/markdown
export const buildHandoffText = (label: string, reason: string, summary: string, question: string): string => {
    const ts = new Date().toLocaleString('zh-CN', { hour12: false })
    const lines = [
        `【${label || 'AI 客服转人工'}】`,
        `时间：${ts}`,
        reason ? `转接原因：${reason}` : '',
        question ? `用户当前问题：${question}` : '',
        '',
        '对话历史 / 上下文：',
        truncate(summary)
    ].filter((l) => l !== '')
    return lines.join('\n')
}

// 飞书自定义机器人「签名校验」：key = timestamp + "\n" + secret，HMAC-SHA256 空消息体，base64
export const feishuSign = (timestamp: string, secret: string): string => {
    const stringToSign = `${timestamp}\n${secret}`
    return crypto.createHmac('sha256', stringToSign).update('').digest('base64')
}

const postToWebhook = async (params: HandoffToolParams, text: string): Promise<void> => {
    const { platform, webhookUrl, feishuSecret } = params

    if (platform === 'feishu') {
        const body: Record<string, any> = { msg_type: 'text', content: { text } }
        if (feishuSecret) {
            const timestamp = Math.floor(Date.now() / 1000).toString()
            body.timestamp = timestamp
            body.sign = feishuSign(timestamp, feishuSecret)
        }
        const resp = await axios.post(webhookUrl, body, { timeout: 15000 })
        // 飞书 200 仍可能返回 code!=0（如签名错误）
        if (resp?.data && resp.data.code) throw new Error(resp.data.msg || `飞书返回 code=${resp.data.code}`)
        return
    }

    // 企业微信群机器人：markdown 消息
    const resp = await axios.post(webhookUrl, { msgtype: 'markdown', markdown: { content: text } }, { timeout: 15000 })
    if (resp?.data && resp.data.errcode) throw new Error(resp.data.errmsg || `企业微信返回 errcode=${resp.data.errcode}`)
}

export const createHandoffTool = (params: HandoffToolParams): DynamicStructuredTool => {
    const { platform, webhookUrl, toolName, toolDescription, sessionLabel } = params
    const pName = platformName(platform)

    const schema = z.object({
        reason: z.string().describe('需要转人工的原因，例如：知识库未覆盖、用户明确要求人工、投诉/纠纷、涉及订单/支付/物流等敏感操作'),
        conversationSummary: z
            .string()
            .describe('与用户的完整对话历史与上下文整理（包含用户关键诉求、已尝试过的解答），供人工坐席快速接手'),
        customerQuestion: z.string().optional().describe('用户当前尚未解决的问题原文')
    })

    return new DynamicStructuredTool({
        name: toolName || 'human_handoff',
        description:
            toolDescription ||
            `当问题超出知识库范围、用户明确要求人工、或涉及订单/支付/物流/售后纠纷/投诉时，调用本工具把会话连同历史上下文转接给${pName}人工坐席。调用前请先把完整对话历史整理进 conversationSummary。`,
        schema,
        func: async ({ reason, conversationSummary, customerQuestion }) => {
            if (!webhookUrl) {
                return '转接失败：未配置 Webhook 地址，请在「转接人工坐席」节点的凭证里填写群机器人 Webhook。'
            }
            const text = buildHandoffText(sessionLabel || '', reason, conversationSummary, customerQuestion || '')
            try {
                await postToWebhook(params, text)
                return `已将会话转接给${pName}人工坐席（含对话历史）。请回复用户：「已为您转接人工客服，请稍候，会有同事尽快跟进。」`
            } catch (e: any) {
                const detail = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || String(e)
                return `转接到${pName}失败：${detail}。请提示用户稍后重试，或先留下联系方式与问题描述。`
            }
        }
    })
}
