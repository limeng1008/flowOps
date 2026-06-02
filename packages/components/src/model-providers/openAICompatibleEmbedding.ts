import { ClientOptions, OpenAIEmbeddingsParams } from '@langchain/openai'

type BaseOptions = string | Record<string, unknown> | undefined

export interface OpenAICompatibleEmbeddingFieldsInput {
    apiKey?: string
    modelName?: string
    customModelName?: string
    stripNewLines?: boolean
    batchSize?: string
    timeout?: string
    dimensions?: string
    providerBaseURL: string
    basePath?: string
    baseOptions?: BaseOptions
}

export type OpenAICompatibleEmbeddingFields = Partial<OpenAIEmbeddingsParams> & {
    openAIApiKey?: string
    configuration?: ClientOptions
}

const parseInteger = (value?: string) => {
    if (value === undefined || value === '') return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : Math.trunc(parsed)
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

export const buildOpenAICompatibleEmbeddingFields = (input: OpenAICompatibleEmbeddingFieldsInput): OpenAICompatibleEmbeddingFields => {
    const fields: OpenAICompatibleEmbeddingFields = {}

    if (input.apiKey) fields.openAIApiKey = input.apiKey

    const modelName = input.customModelName || input.modelName
    if (modelName) fields.modelName = modelName
    if (input.stripNewLines) fields.stripNewLines = input.stripNewLines

    const batchSize = parseInteger(input.batchSize)
    if (batchSize !== undefined) fields.batchSize = batchSize

    const timeout = parseInteger(input.timeout)
    if (timeout !== undefined) fields.timeout = timeout

    const dimensions = parseInteger(input.dimensions)
    if (dimensions !== undefined) fields.dimensions = dimensions

    const defaultHeaders = parseBaseOptions(input.baseOptions)
    const baseURL = input.basePath || input.providerBaseURL
    fields.configuration = {
        baseURL,
        ...(defaultHeaders ? { defaultHeaders } : {})
    }

    return fields
}
