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
    // 运行时完整对话历史（用户 + 客服双方），由 Agent 透传 options.agentflowRuntime.chatHistory
    chatHistory?: any[]
}

// 企业微信/飞书群机器人对消息体长度有限制，超长会被拒收，这里整理后截断。
const MAX_LEN = 3500
const truncate = (s: string, n = MAX_LEN): string => {
    const str = s || ''
    return str.length > n ? `${str.slice(0, n)}\n…（内容过长已截断）` : str
}

const platformName = (platform: HandoffPlatform): string => (platform === 'feishu' ? '飞书' : '企业微信')

// 从一条消息里取角色标签：用户 / 客服 / 系统（兼容 IMessage{type} 与 BaseMessage{_getType}）
const messageRole = (item: any): string => {
    const t = (typeof item?._getType === 'function' ? item._getType() : item?.type ?? item?.role) || ''
    if (t === 'userMessage' || t === 'human' || t === 'user') return '用户'
    if (t === 'apiMessage' || t === 'ai' || t === 'assistant') return '客服'
    if (t === 'system' || t === 'developer') return '系统'
    return '消息'
}

// 取消息文本（兼容 {message} / {content} / [role, content] / 内容数组）
const messageText = (item: any): string => {
    if (Array.isArray(item) && item.length === 2) return String(item[1] ?? '')
    const c = item?.message ?? item?.content ?? item?.text
    if (typeof c === 'string') return c
    if (Array.isArray(c))
        return c
            .map((p: any) => (typeof p === 'string' ? p : p?.text || ''))
            .filter(Boolean)
            .join(' ')
    return c != null ? String(c) : ''
}

// 把完整对话历史（双方）整理成「用户：… / 客服：…」逐行文本
export const formatChatHistory = (history: any[]): string => {
    if (!Array.isArray(history) || history.length === 0) return ''
    const lines: string[] = []
    for (const item of history) {
        const text = messageText(item).trim()
        if (text) lines.push(`${messageRole(item)}：${text}`)
    }
    return lines.join('\n')
}

// 把转接信息拼成一段人工坐席可读的文本（含双方完整对话）
export const buildHandoffText = (label: string, reason: string, transcript: string, summary: string, question: string): string => {
    const ts = new Date().toLocaleString('zh-CN', { hour12: false })
    const lines = [
        `【${label || 'AI 客服转人工'}】`,
        `时间：${ts}`,
        reason ? `转接原因：${reason}` : '',
        question ? `用户当前问题：${question}` : ''
    ]
    if (transcript) {
        lines.push('', '完整对话记录（用户 & 客服）：', truncate(transcript, 3000))
        if (summary) lines.push('', `AI 小结：${truncate(summary, 400)}`)
    } else {
        // 没拿到运行时历史时（如非 agentflow 场景），退回用 AI 整理的小结
        lines.push('', '对话历史 / 上下文：', summary ? truncate(summary) : '（无）')
    }
    return lines.filter((l) => l !== '').join('\n')
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
    const { platform, webhookUrl, toolName, toolDescription, sessionLabel, chatHistory } = params
    const pName = platformName(platform)

    const schema = z.object({
        reason: z.string().describe('需要转人工的原因，例如：知识库未覆盖、用户明确要求人工、投诉/纠纷、涉及订单/支付/物流等敏感操作'),
        customerQuestion: z.string().optional().describe('用户当前尚未解决的问题原文'),
        conversationSummary: z
            .string()
            .optional()
            .describe('可选：对话要点补充。系统会自动附上用户与客服的完整对话记录，这里只需补充关键信息')
    })

    return new DynamicStructuredTool({
        name: toolName || 'human_handoff',
        schema,
        description:
            toolDescription ||
            `当问题超出知识库范围、用户明确要求人工、或涉及订单/支付/物流/售后纠纷/投诉时，调用本工具把会话转接给${pName}人工坐席。系统会自动带上用户与客服双方的完整对话历史，你只需填写 reason 与 customerQuestion。`,
        func: async ({ reason, customerQuestion, conversationSummary }) => {
            if (!webhookUrl) {
                return '转接失败：未配置 Webhook 地址，请在「转接人工坐席」节点的凭证里填写群机器人 Webhook。'
            }
            const transcript = formatChatHistory(chatHistory || [])
            const text = buildHandoffText(sessionLabel || '', reason, transcript, conversationSummary || '', customerQuestion || '')
            try {
                await postToWebhook(params, text)
                return `已将会话转接给${pName}人工坐席（含用户与客服的完整对话记录）。请回复用户：「已为您转接人工客服，请稍候，会有同事尽快跟进。」`
            } catch (e: any) {
                const detail = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || String(e)
                return `转接到${pName}失败：${detail}。请提示用户稍后重试，或先留下联系方式与问题描述。`
            }
        }
    })
}
