import axios from 'axios'
import { Moderation } from '../Moderation'

export type ContentSafetyModerationMode = 'local' | 'http' | 'mock'
export type ContentSafetyViolationAction = 'block' | 'mask' | 'passLog'

export interface ContentSafetyModerationParams {
    moderationMode?: ContentSafetyModerationMode
    sensitiveWords?: string
    customRegex?: string
    apiUrl?: string
    authHeaderValue?: string
    onViolation?: ContentSafetyViolationAction
    moderationErrorMessage?: string
}

type DetectionResult = {
    risky: boolean
    hits: string[]
}

const DEFAULT_ERROR_MESSAGE = '您的内容包含敏感信息，已被拦截。'
const MOCK_SENSITIVE_WORDS = ['测试敏感词', '违禁']

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const splitSensitiveWords = (value?: string): string[] =>
    Array.from(
        new Set(
            String(value || '')
                .split(/[\n,，]/)
                .map((item) => item.trim())
                .filter(Boolean)
        )
    )

const matchWords = (input: string, words: string[]): string[] => {
    const lower = input.toLowerCase()
    return words.filter((word) => lower.includes(word.toLowerCase()))
}

const matchRegex = (input: string, customRegex?: string): string[] => {
    const pattern = (customRegex || '').trim()
    if (!pattern) return []

    try {
        const regex = new RegExp(pattern, 'g')
        return Array.from(input.matchAll(regex))
            .map((match) => match[0])
            .filter(Boolean)
    } catch (error) {
        console.warn(`内容安全审核：自定义正则无效，已跳过。${error}`)
        return []
    }
}

const uniqueHits = (hits: string[]): string[] => Array.from(new Set(hits.filter(Boolean)))

const isRiskValue = (value: unknown): boolean => {
    if (value === true) return true
    if (typeof value === 'number') return value > 0
    if (typeof value !== 'string') return false

    const normalized = value.trim().toLowerCase()
    if (!normalized) return false
    if (['false', 'safe', 'pass', 'allow', 'none', 'low', 'ok', '0'].includes(normalized)) return false
    return ['true', 'risk', 'risky', 'high', 'medium', 'block', 'blocked', 'reject', 'violation', 'sensitive'].includes(normalized)
}

const asStringArray = (value: unknown): string[] => {
    if (!value) return []
    if (typeof value === 'string') return [value]
    if (!Array.isArray(value)) return []
    return value
        .map((item) => {
            if (typeof item === 'string') return item
            if (item && typeof item === 'object') {
                const found = Object.values(item).find((v) => typeof v === 'string')
                return found ? String(found) : ''
            }
            return ''
        })
        .filter(Boolean)
}

const extractHttpDetection = (data: any, input: string): DetectionResult => {
    const risky =
        isRiskValue(data?.risk) ||
        isRiskValue(data?.label) ||
        isRiskValue(data?.action) ||
        isRiskValue(data?.decision) ||
        isRiskValue(data?.result)

    const hits = uniqueHits([
        ...asStringArray(data?.hits),
        ...asStringArray(data?.hitWords),
        ...asStringArray(data?.matched),
        ...asStringArray(data?.matches),
        ...asStringArray(data?.segments)
    ])

    if (!risky) {
        if (data && typeof data === 'object') console.warn('内容安全审核：接口返回未识别为风险，已按未命中放行。')
        return { risky: false, hits: [] }
    }

    return { risky: true, hits: hits.length ? hits : [input] }
}

const maskHits = (input: string, hits: string[]): string => {
    let output = input
    const orderedHits = uniqueHits(hits).sort((a, b) => b.length - a.length)

    for (const hit of orderedHits) {
        output = output.replace(new RegExp(escapeRegExp(hit), 'gi'), '***')
    }

    return output
}

export class ContentSafetyModerationRunner extends Moderation {
    private readonly params: ContentSafetyModerationParams

    constructor(params: ContentSafetyModerationParams) {
        super()
        this.params = {
            moderationMode: params.moderationMode || 'local',
            onViolation: params.onViolation || 'block',
            moderationErrorMessage: params.moderationErrorMessage || DEFAULT_ERROR_MESSAGE,
            sensitiveWords: params.sensitiveWords || '',
            customRegex: params.customRegex || '',
            apiUrl: params.apiUrl || '',
            authHeaderValue: params.authHeaderValue || ''
        }
    }

    private async detect(input: string): Promise<DetectionResult> {
        if (this.params.moderationMode === 'mock') {
            return { risky: true, hits: matchWords(input, MOCK_SENSITIVE_WORDS) }
        }

        if (this.params.moderationMode === 'http') {
            if (!this.params.apiUrl) {
                console.warn('内容安全审核：未配置审核接口地址，已按未命中放行。')
                return { risky: false, hits: [] }
            }

            try {
                const headers: Record<string, string> = {}
                if (this.params.authHeaderValue) headers.Authorization = this.params.authHeaderValue
                const resp = await axios.post(this.params.apiUrl, { text: input }, { headers, timeout: 15000 })
                return extractHttpDetection(resp?.data, input)
            } catch (error) {
                console.warn(`内容安全审核：外部接口异常，已安全放行。${error}`)
                return { risky: false, hits: [] }
            }
        }

        const hits = uniqueHits([
            ...matchWords(input, splitSensitiveWords(this.params.sensitiveWords)),
            ...matchRegex(input, this.params.customRegex)
        ])

        return { risky: hits.length > 0, hits }
    }

    async checkForViolations(input: string): Promise<string> {
        const result = await this.detect(input)
        if (!result.risky || result.hits.length === 0) return input

        if (this.params.onViolation === 'mask') return maskHits(input, result.hits)
        if (this.params.onViolation === 'passLog') {
            console.warn(`内容安全审核：命中但按配置放行，仅记录。命中项：${result.hits.join(', ')}`)
            return input
        }

        throw new Error(this.params.moderationErrorMessage || DEFAULT_ERROR_MESSAGE)
    }
}
