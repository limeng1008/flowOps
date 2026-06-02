import { BaseCache } from '@langchain/core/caches'
import { ChatOpenAIFields } from '@langchain/openai'

export const ZHIPU_DEFAULT_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/'
export const MOONSHOT_DEFAULT_BASE_URL = 'https://api.moonshot.cn/v1'

type BaseOptions = string | Record<string, unknown> | undefined

export interface OpenAICompatibleChatFieldsInput {
    apiKey: string
    modelName?: string
    customModelName?: string
    temperature?: string
    streaming?: boolean
    maxTokens?: string
    topP?: string
    frequencyPenalty?: string
    presencePenalty?: string
    timeout?: string
    stopSequence?: string
    cache?: BaseCache
    providerBaseURL: string
    basePath?: string
    baseOptions?: BaseOptions
}

const parseNumber = (value?: string) => {
    if (value === undefined || value === '') return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
}

const parseInteger = (value?: string) => {
    const parsed = parseNumber(value)
    return parsed === undefined ? undefined : Math.trunc(parsed)
}

const parseBaseOptions = (baseOptions: BaseOptions) => {
    if (!baseOptions) return undefined
    if (typeof baseOptions === 'object') return baseOptions

    try {
        return JSON.parse(baseOptions)
    } catch (error) {
        throw new Error(`Invalid JSON in the Base Options: ${error}`)
    }
}

export const buildOpenAICompatibleChatFields = (input: OpenAICompatibleChatFieldsInput): ChatOpenAIFields => {
    const temperature = parseNumber(input.temperature)
    const maxTokens = parseInteger(input.maxTokens)
    const topP = parseNumber(input.topP)
    const frequencyPenalty = parseNumber(input.frequencyPenalty)
    const presencePenalty = parseNumber(input.presencePenalty)
    const timeout = parseInteger(input.timeout)
    const defaultHeaders = parseBaseOptions(input.baseOptions)
    const baseURL = input.basePath || input.providerBaseURL

    const fields: ChatOpenAIFields = {
        apiKey: input.apiKey,
        openAIApiKey: input.apiKey,
        modelName: input.customModelName || input.modelName,
        streaming: input.streaming ?? true,
        configuration: {
            baseURL,
            ...(defaultHeaders ? { defaultHeaders } : {})
        }
    }

    if (temperature !== undefined) fields.temperature = temperature
    if (maxTokens !== undefined) fields.maxTokens = maxTokens
    if (topP !== undefined) fields.topP = topP
    if (frequencyPenalty !== undefined) fields.frequencyPenalty = frequencyPenalty
    if (presencePenalty !== undefined) fields.presencePenalty = presencePenalty
    if (timeout !== undefined) fields.timeout = timeout
    if (input.cache) fields.cache = input.cache
    if (input.stopSequence) {
        fields.stop = input.stopSequence
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
    }

    return fields
}
