import { flatten } from 'lodash'
import { v4 as uuid } from 'uuid'
import { Document } from '@langchain/core/documents'
import { Embeddings } from '@langchain/core/embeddings'
import { VectorStore } from '@langchain/core/vectorstores'
import { ICommonObject, INodeData, INodeOptionsValue, INodeOutputsValue, INodeParams, IndexingResult } from '../../../src/Interface'
import { FLOWISE_CHATID, getBaseClasses, parseJsonBody } from '../../../src/utils'
import { index } from '../../../src/indexing'
import { howToUseFileUpload } from '../VectorStoreUtils'

export const CLOUD_VECTOR_ERROR_CODES = {
    AUTH: 'CLOUD_VECTOR_AUTH_ERROR',
    RESOURCE_NOT_FOUND: 'CLOUD_VECTOR_RESOURCE_NOT_FOUND',
    DIMENSION_MISMATCH: 'CLOUD_VECTOR_DIMENSION_MISMATCH',
    FILTER: 'CLOUD_VECTOR_FILTER_ERROR',
    RATE_LIMIT: 'CLOUD_VECTOR_RATE_LIMIT',
    PROVIDER: 'CLOUD_VECTOR_PROVIDER_ERROR'
} as const

export type CloudVectorErrorCode = (typeof CLOUD_VECTOR_ERROR_CODES)[keyof typeof CLOUD_VECTOR_ERROR_CODES]

export type CloudVectorMetric = 'cosine' | 'euclidean' | 'dot'
export type CloudVectorScoreType = 'similarity' | 'distance'

export type CloudVectorFields = {
    idField: string
    textField: string
    vectorField: string
    metadataField: string
}

export type CloudVectorResource = {
    databaseName?: string
    collectionName: string
}

export type PreparedCloudVectorDocument = {
    id: string
    text: string
    vector?: number[]
    metadata: Record<string, any>
}

export type CloudVectorSearchResult = {
    id?: string
    text?: string
    metadata?: Record<string, any>
    score?: number
    vector?: number[]
}

export type CloudVectorEnsureCollectionParams = CloudVectorResource & {
    vectorDimension: number
    metric: CloudVectorMetric
    fields: CloudVectorFields
    autoCreate?: boolean
    indexParams?: Record<string, any>
}

export type CloudVectorUpsertParams = CloudVectorResource & {
    documents: PreparedCloudVectorDocument[]
    fields: CloudVectorFields
}

export type CloudVectorSearchParams = CloudVectorResource & {
    vector: number[]
    topK: number
    filter?: object | string
    fields: CloudVectorFields
    includeMetadata: boolean
    includeVector: boolean
}

export type CloudVectorDeleteParams = CloudVectorResource & {
    ids: string[]
}

export interface CloudVectorProviderClient {
    listDatabases?: () => Promise<string[]>
    listCollections?: (databaseName?: string) => Promise<string[]>
    ensureCollection?: (params: CloudVectorEnsureCollectionParams) => Promise<void>
    upsert: (params: CloudVectorUpsertParams) => Promise<void>
    search: (params: CloudVectorSearchParams) => Promise<CloudVectorSearchResult[]>
    delete?: (params: CloudVectorDeleteParams) => Promise<void>
}

export type CloudVectorStoreArgs = {
    providerName: string
    typeName: string
    client: CloudVectorProviderClient
    resource: CloudVectorResource
    fields: CloudVectorFields
    autoCreate: boolean
    vectorDimension: number
    metric: CloudVectorMetric
    batchSize?: number
    indexParams?: Record<string, any>
    includeMetadata?: boolean
    includeVector?: boolean
    scoreType?: CloudVectorScoreType
    retryCount?: number
    retryDelayMs?: number
}

export class CloudVectorStore extends VectorStore {
    private readonly providerName: string
    private readonly typeName: string
    private readonly client: CloudVectorProviderClient
    private readonly resource: CloudVectorResource
    private readonly fields: CloudVectorFields
    private readonly autoCreate: boolean
    private readonly vectorDimension: number
    private readonly metric: CloudVectorMetric
    private readonly batchSize?: number
    private readonly indexParams?: Record<string, any>
    private readonly includeMetadata: boolean
    private readonly includeVector: boolean
    private readonly scoreType: CloudVectorScoreType
    private readonly retryCount: number
    private readonly retryDelayMs: number

    constructor(embeddings: Embeddings, args: CloudVectorStoreArgs) {
        super(embeddings, args)
        this.providerName = args.providerName
        this.typeName = args.typeName
        this.client = args.client
        this.resource = args.resource
        this.fields = args.fields
        this.autoCreate = args.autoCreate
        this.vectorDimension = args.vectorDimension
        this.metric = args.metric
        this.batchSize = args.batchSize
        this.indexParams = args.indexParams
        this.includeMetadata = args.includeMetadata ?? true
        this.includeVector = args.includeVector ?? false
        this.scoreType = args.scoreType ?? 'similarity'
        this.retryCount = args.retryCount ?? 2
        this.retryDelayMs = args.retryDelayMs ?? 250
    }

    _vectorstoreType(): string {
        return this.typeName
    }

    async addDocuments(documents: Document[], options?: ICommonObject): Promise<string[]> {
        const validDocs = (documents ?? []).filter((doc) => doc?.pageContent)
        const texts = validDocs.map((doc) => doc.pageContent)
        const vectors = texts.length ? await this.embeddings.embedDocuments(texts) : []
        return await this.addVectors(vectors, validDocs, options)
    }

    async addVectors(vectors: number[][], documents: Document[], options?: ICommonObject): Promise<string[]> {
        try {
            const finalDocs = prepareCloudVectorDocuments(documents, {
                ...this.fields,
                chatId: options?.chatId
            })

            if (!finalDocs.length) return []

            if (vectors.length !== finalDocs.length) {
                throw buildCloudVectorError(
                    CLOUD_VECTOR_ERROR_CODES.DIMENSION_MISMATCH,
                    `${this.providerName} 向量数量与文档数量不一致，请检查 Embedding 节点输出。`
                )
            }

            const explicitIds = Array.isArray(options?.ids) ? (options?.ids as string[]) : undefined
            finalDocs.forEach((doc, index) => {
                if (explicitIds?.[index]) {
                    doc.id = explicitIds[index]
                    doc.metadata[this.fields.idField] = explicitIds[index]
                }
                if (!vectors[index]?.length) {
                    throw buildCloudVectorError(
                        CLOUD_VECTOR_ERROR_CODES.DIMENSION_MISMATCH,
                        `${this.providerName} 生成了空向量，请检查 Embedding 模型。`
                    )
                }
                doc.vector = vectors[index]
            })

            if (this.client.ensureCollection) {
                await retryCloudVectorOperation(
                    this.providerName,
                    () =>
                        this.client.ensureCollection!({
                            ...this.resource,
                            vectorDimension: this.vectorDimension,
                            metric: this.metric,
                            fields: this.fields,
                            autoCreate: this.autoCreate,
                            indexParams: this.indexParams
                        }),
                    {
                        retryCount: this.retryCount,
                        retryDelayMs: this.retryDelayMs
                    }
                )
            }

            const batches = chunkArray(finalDocs, this.batchSize || finalDocs.length)
            for (const batch of batches) {
                await retryCloudVectorOperation(
                    this.providerName,
                    () =>
                        this.client.upsert({
                            ...this.resource,
                            documents: batch,
                            fields: this.fields
                        }),
                    {
                        retryCount: this.retryCount,
                        retryDelayMs: this.retryDelayMs
                    }
                )
            }

            return finalDocs.map((doc) => doc.id)
        } catch (e) {
            throw normalizeCloudVectorError(this.providerName, e)
        }
    }

    async similaritySearchVectorWithScore(query: number[], k: number, filter?: this['FilterType']): Promise<[Document, number][]> {
        try {
            const results = await retryCloudVectorOperation(
                this.providerName,
                () =>
                    this.client.search({
                        ...this.resource,
                        vector: query,
                        topK: k,
                        filter: (filter ?? (this as any).filter) as object | string | undefined,
                        fields: this.fields,
                        includeMetadata: this.includeMetadata,
                        includeVector: this.includeVector
                    }),
                {
                    retryCount: this.retryCount,
                    retryDelayMs: this.retryDelayMs
                }
            )

            return results.map((result) => {
                const metadata = {
                    ...(result.metadata ?? {})
                }
                if (result.id && metadata[this.fields.idField] === undefined) {
                    metadata[this.fields.idField] = result.id
                }
                const score = scoreToRelevance(result.score ?? 0, this.scoreType)
                return [new Document({ pageContent: result.text ?? '', metadata }), score]
            })
        } catch (e) {
            throw normalizeCloudVectorError(this.providerName, e)
        }
    }

    async delete(params?: Record<string, any>): Promise<void> {
        if (!this.client.delete) {
            throw buildCloudVectorError(CLOUD_VECTOR_ERROR_CODES.PROVIDER, `${this.providerName} 当前客户端不支持删除操作。`)
        }

        const ids = params?.ids ?? params?.points ?? []
        if (!Array.isArray(ids) || !ids.length) return

        try {
            await retryCloudVectorOperation(
                this.providerName,
                () =>
                    this.client.delete!({
                        ...this.resource,
                        ids
                    }),
                {
                    retryCount: this.retryCount,
                    retryDelayMs: this.retryDelayMs
                }
            )
        } catch (e) {
            throw normalizeCloudVectorError(this.providerName, e)
        }
    }
}

export const CLOUD_VECTOR_EMBEDDING_PRESETS = {
    custom: undefined,
    'text-embedding-v4': 1024,
    'bge-m3': 1024,
    'bge-large-zh': 1024,
    'm3e-base': 768,
    'text-embedding-v3': 1024
} as const

export const resolveCloudVectorDimension = (dimension?: unknown, preset?: unknown): number => {
    const parsed = dimension ? parseInt(String(dimension), 10) : Number.NaN
    if (Number.isFinite(parsed) && parsed > 0) return parsed
    const presetDimension = CLOUD_VECTOR_EMBEDDING_PRESETS[String(preset || 'custom') as keyof typeof CLOUD_VECTOR_EMBEDDING_PRESETS]
    return presetDimension ?? 1536
}

export const retryCloudVectorOperation = async <T>(
    providerName: string,
    operation: () => Promise<T>,
    options: {
        retryCount?: number
        retryDelayMs?: number
    } = {}
): Promise<T> => {
    const retryCount = Math.max(0, options.retryCount ?? 2)
    const retryDelayMs = Math.max(0, options.retryDelayMs ?? 250)
    let lastError: unknown

    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        try {
            return await operation()
        } catch (e) {
            lastError = e
            const normalized = normalizeCloudVectorError(providerName, e)
            if (normalized.code !== CLOUD_VECTOR_ERROR_CODES.RATE_LIMIT || attempt >= retryCount) {
                throw normalized
            }
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs * Math.pow(2, attempt)))
        }
    }

    throw normalizeCloudVectorError(providerName, lastError)
}

export const prepareCloudVectorDocuments = (
    docs: Document[],
    fields: CloudVectorFields & {
        chatId?: string
    }
): PreparedCloudVectorDocument[] => {
    const flattenDocs = docs && docs.length ? flatten(docs) : []
    return flattenDocs
        .filter((doc) => doc?.pageContent)
        .map((doc) => {
            const metadata = {
                ...(doc.metadata ?? {})
            }
            if (fields.chatId) {
                metadata[FLOWISE_CHATID] = fields.chatId
            }
            const id = String(metadata[fields.idField] ?? metadata.docId ?? metadata.id ?? uuid())
            metadata[fields.idField] = id
            return {
                id,
                text: doc.pageContent,
                metadata
            }
        })
}

export const chunkArray = <T>(items: T[], size: number): T[][] => {
    if (!items.length) return []
    if (!size || size <= 0 || size >= items.length) return [items]
    const chunks: T[][] = []
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size))
    }
    return chunks
}

export const scoreToRelevance = (score: number, scoreType: CloudVectorScoreType): number => {
    if (!Number.isFinite(score)) return 0
    if (scoreType === 'distance') return 1 / (1 + Math.max(score, 0))
    return Math.max(0, Math.min(1, score))
}

export const buildCloudVectorError = (
    code: CloudVectorErrorCode,
    message: string,
    cause?: unknown
): Error & { code: CloudVectorErrorCode } => {
    const error = new Error(message) as Error & { code: CloudVectorErrorCode; cause?: unknown }
    error.code = code
    error.cause = cause
    return error
}

export const normalizeCloudVectorError = (providerName: string, error: any): Error & { code: CloudVectorErrorCode } => {
    if (error?.code && Object.values(CLOUD_VECTOR_ERROR_CODES).includes(error.code)) {
        return error
    }

    const status = error?.status ?? error?.response?.status
    const providerMessage =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.response?.data?.msg ??
        error?.message ??
        (typeof error === 'string' ? error : '未知错误')
    const text = String(providerMessage)
    const lowered = text.toLowerCase()

    if (
        status === 401 ||
        status === 403 ||
        lowered.includes('unauthorized') ||
        lowered.includes('forbidden') ||
        lowered.includes('signature')
    ) {
        return buildCloudVectorError(
            CLOUD_VECTOR_ERROR_CODES.AUTH,
            `${providerName} 认证失败，请检查凭证、地域和 endpoint。原始错误：${text}`,
            error
        )
    }
    if (status === 404 || lowered.includes('not found') || lowered.includes('不存在')) {
        return buildCloudVectorError(
            CLOUD_VECTOR_ERROR_CODES.RESOURCE_NOT_FOUND,
            `${providerName} 资源不存在，请检查数据库、集合或表名，或开启自动创建。原始错误：${text}`,
            error
        )
    }
    if (status === 429 || lowered.includes('rate') || lowered.includes('too many')) {
        return buildCloudVectorError(
            CLOUD_VECTOR_ERROR_CODES.RATE_LIMIT,
            `${providerName} 请求过于频繁，请稍后重试或调整批量大小。原始错误：${text}`,
            error
        )
    }
    if (lowered.includes('dimension') || lowered.includes('维度')) {
        return buildCloudVectorError(
            CLOUD_VECTOR_ERROR_CODES.DIMENSION_MISMATCH,
            `${providerName} 向量维度与集合配置不一致，请检查 Embedding 模型维度和集合维度。原始错误：${text}`,
            error
        )
    }
    if (lowered.includes('filter') || lowered.includes('where') || lowered.includes('syntax') || lowered.includes('过滤')) {
        return buildCloudVectorError(
            CLOUD_VECTOR_ERROR_CODES.FILTER,
            `${providerName} 过滤条件非法，请检查厂商原生过滤语法。原始错误：${text}`,
            error
        )
    }

    return buildCloudVectorError(CLOUD_VECTOR_ERROR_CODES.PROVIDER, `${providerName} 调用失败。原始错误：${text}`, error)
}

export const parseOptionalJson = (value: unknown): object | string | undefined => {
    if (!value) return undefined
    if (typeof value === 'object') return value as object
    const text = String(value).trim()
    if (!text) return undefined
    if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
        return parseJsonBody(text)
    }
    return text
}

export const getCloudVectorFields = (nodeData: INodeData): CloudVectorFields => ({
    idField: (nodeData.inputs?.idField as string) || 'id',
    textField: (nodeData.inputs?.textField as string) || 'content',
    vectorField: (nodeData.inputs?.vectorField as string) || 'vector',
    metadataField: (nodeData.inputs?.metadataField as string) || 'metadata'
})

export const getCloudVectorStoreArgs = (
    nodeData: INodeData,
    client: CloudVectorProviderClient,
    providerName: string,
    typeName: string
): CloudVectorStoreArgs => {
    const batchSize = nodeData.inputs?.batchSize ? parseInt(nodeData.inputs.batchSize as string, 10) : undefined
    return {
        providerName,
        typeName,
        client,
        resource: {
            databaseName: nodeData.inputs?.databaseName as string,
            collectionName: nodeData.inputs?.collectionName as string
        },
        fields: getCloudVectorFields(nodeData),
        autoCreate: Boolean(nodeData.inputs?.autoCreate),
        vectorDimension: resolveCloudVectorDimension(nodeData.inputs?.vectorDimension, nodeData.inputs?.embeddingPreset),
        metric: ((nodeData.inputs?.metric as string) || 'cosine') as CloudVectorMetric,
        batchSize: Number.isFinite(batchSize) ? batchSize : undefined,
        indexParams: parseOptionalJson(nodeData.inputs?.indexParams) as Record<string, any> | undefined,
        includeMetadata: nodeData.inputs?.includeMetadata !== false,
        includeVector: Boolean(nodeData.inputs?.includeVector),
        retryCount: nodeData.inputs?.retryCount ? parseInt(nodeData.inputs.retryCount as string, 10) : 2,
        retryDelayMs: nodeData.inputs?.retryDelayMs ? parseInt(nodeData.inputs.retryDelayMs as string, 10) : 250
    }
}

export const createCloudVectorStore = (
    nodeData: INodeData,
    embeddings: Embeddings,
    client: CloudVectorProviderClient,
    providerName: string,
    typeName: string
): CloudVectorStore => new CloudVectorStore(embeddings, getCloudVectorStoreArgs(nodeData, client, providerName, typeName))

export const getCommonCloudVectorInputs = (databaseLoadMethod: string, collectionLoadMethod: string): INodeParams[] => [
    {
        label: 'Document',
        name: 'document',
        type: 'Document',
        list: true,
        optional: true
    },
    {
        label: 'Embeddings',
        name: 'embeddings',
        type: 'Embeddings'
    },
    {
        label: 'Record Manager',
        name: 'recordManager',
        type: 'RecordManager',
        description: '开启后按文档 hash 做去重、重建和清理，适合知识库持续增量同步。',
        optional: true
    },
    {
        label: '开通与凭证说明',
        name: 'credentialGuide',
        type: 'string',
        description:
            '先在对应云厂商控制台开通向量数据库服务，创建实例并获取 Endpoint / API Key / AK-SK，再回到凭证页填写。腾讯云：VectorDB；阿里云：DashVector；百度智能云：VectorDB/Mochow；火山引擎：VikingDB。',
        optional: true,
        additionalParams: true
    },
    {
        label: 'Database Name',
        name: 'databaseName',
        type: 'asyncOptions',
        loadMethod: databaseLoadMethod,
        freeSolo: true,
        optional: true,
        acceptVariable: true
    },
    {
        label: 'Collection/Table Name',
        name: 'collectionName',
        type: 'asyncOptions',
        loadMethod: collectionLoadMethod,
        freeSolo: true,
        acceptVariable: true
    },
    {
        label: 'File Upload',
        name: 'fileUpload',
        description: 'Allow file upload on the chat',
        hint: {
            label: 'How to use',
            value: howToUseFileUpload
        },
        type: 'boolean',
        additionalParams: true,
        optional: true
    },
    {
        label: 'ID Field',
        name: 'idField',
        type: 'string',
        default: 'id',
        additionalParams: true
    },
    {
        label: 'Text Field',
        name: 'textField',
        type: 'string',
        default: 'content',
        additionalParams: true
    },
    {
        label: 'Vector Field',
        name: 'vectorField',
        type: 'string',
        default: 'vector',
        additionalParams: true
    },
    {
        label: 'Metadata Field',
        name: 'metadataField',
        type: 'string',
        default: 'metadata',
        additionalParams: true
    },
    {
        label: 'Top K',
        name: 'topK',
        description: 'Number of top results to fetch. Default to 4',
        placeholder: '4',
        type: 'number',
        additionalParams: true,
        optional: true
    },
    {
        label: 'Batch Size',
        name: 'batchSize',
        description: 'Number of documents to upsert per provider request',
        placeholder: '64',
        type: 'number',
        additionalParams: true,
        optional: true
    },
    {
        label: 'Metadata Filter',
        name: 'metadataFilter',
        description:
            '厂商原生 metadata 过滤条件。示例：{"source":"manual.md"}。JSON 会自动解析，非 JSON 字符串原样传给厂商 API。自动建集合时请确认过滤字段已在云端 schema / index 中可检索。',
        type: 'json',
        optional: true,
        additionalParams: true,
        acceptVariable: true
    },
    {
        label: 'Include Metadata',
        name: 'includeMetadata',
        type: 'boolean',
        default: true,
        additionalParams: true,
        optional: true
    },
    {
        label: 'Include Vector',
        name: 'includeVector',
        type: 'boolean',
        default: false,
        additionalParams: true,
        optional: true
    },
    {
        label: 'Embedding Preset',
        name: 'embeddingPreset',
        description:
            '常用 embedding 维度预设。text-embedding-v4 常用 1024 维，bge-m3 常用 1024 维；如果手动填写 Vector Dimension，则优先使用手动值。',
        type: 'options',
        default: 'custom',
        options: [
            { label: 'Custom / 手动填写', name: 'custom' },
            { label: 'Qwen text-embedding-v4 (1024)', name: 'text-embedding-v4' },
            { label: 'BAAI bge-m3 (1024)', name: 'bge-m3' },
            { label: 'bge-large-zh (1024)', name: 'bge-large-zh' },
            { label: 'm3e-base (768)', name: 'm3e-base' },
            { label: 'text-embedding-v3 (1024)', name: 'text-embedding-v3' }
        ],
        additionalParams: true,
        optional: true
    },
    {
        label: 'Auto Create If Not Exists',
        name: 'autoCreate',
        type: 'boolean',
        description:
            '开启后会按 Vector Dimension、Metric 和 Index Params 自动创建集合/表。生产环境建议先在云控制台确认字段 schema、维度和计费规格。',
        default: false,
        additionalParams: true,
        optional: true
    },
    {
        label: 'Retry Count',
        name: 'retryCount',
        description: '云 API 遇到限流时的重试次数。默认 2 次。',
        placeholder: '2',
        type: 'number',
        additionalParams: true,
        optional: true
    },
    {
        label: 'Retry Delay (ms)',
        name: 'retryDelayMs',
        description: '云 API 限流重试的初始等待时间，之后按指数退避。默认 250ms。',
        placeholder: '250',
        type: 'number',
        additionalParams: true,
        optional: true
    },
    {
        label: 'Vector Dimension',
        name: 'vectorDimension',
        type: 'number',
        default: 1536,
        additionalParams: true,
        optional: true
    },
    {
        label: 'Metric',
        name: 'metric',
        type: 'options',
        default: 'cosine',
        options: [
            { label: 'Cosine', name: 'cosine' },
            { label: 'Euclidean', name: 'euclidean' },
            { label: 'Dot Product', name: 'dot' }
        ],
        additionalParams: true,
        optional: true
    },
    {
        label: 'Index Params',
        name: 'indexParams',
        description: 'Provider native index creation parameters as JSON',
        type: 'json',
        optional: true,
        additionalParams: true
    }
]

export const getCloudVectorOutputs = (providerLabel: string, type: string): INodeOutputsValue[] => [
    {
        label: `${providerLabel} Retriever`,
        name: 'retriever',
        baseClasses: [type, 'VectorStoreRetriever', 'BaseRetriever']
    },
    {
        label: `${providerLabel} Vector Store`,
        name: 'vectorStore',
        baseClasses: [type, ...getBaseClasses(CloudVectorStore)]
    }
]

const getCloudVectorRecordManagerName = (nodeData: INodeData, typeName: string): string =>
    `${typeName}_${nodeData.inputs?.databaseName ?? 'default'}_${nodeData.inputs?.collectionName ?? 'default'}`

const scopeCloudVectorRecordManager = (recordManager: ICommonObject, vectorStoreName: string): void => {
    const namespace = String(recordManager.namespace ?? '')
    if (namespace && !namespace.endsWith(`_${vectorStoreName}`)) {
        recordManager.namespace = `${namespace}_${vectorStoreName}`
    }
}

export const runCloudVectorUpsert = async (
    nodeData: INodeData,
    options: ICommonObject,
    client: CloudVectorProviderClient,
    providerName: string,
    typeName: string
): Promise<Partial<IndexingResult>> => {
    const embeddings = nodeData.inputs?.embeddings as Embeddings
    const docs = nodeData.inputs?.document as Document[]
    const recordManager = nodeData.inputs?.recordManager
    const store = createCloudVectorStore(nodeData, embeddings, client, providerName, typeName)
    const addedDocs = prepareCloudVectorDocuments(docs ?? [], {
        ...getCloudVectorFields(nodeData),
        chatId: nodeData.inputs?.fileUpload ? options?.chatId : undefined
    }).map((doc) => new Document({ pageContent: doc.text, metadata: doc.metadata }))

    if (recordManager) {
        await recordManager.createSchema()
        return await index({
            docsSource: addedDocs,
            recordManager,
            vectorStore: store,
            options: {
                cleanup: recordManager?.cleanup,
                sourceIdKey: recordManager?.sourceIdKey ?? 'source',
                vectorStoreName: getCloudVectorRecordManagerName(nodeData, typeName)
            }
        })
    }

    const ids = await store.addDocuments(docs ?? [], {
        chatId: nodeData.inputs?.fileUpload ? options?.chatId : undefined
    })
    return {
        numAdded: ids.length,
        addedDocs
    }
}

export const runCloudVectorDelete = async (
    nodeData: INodeData,
    ids: string[],
    options: ICommonObject,
    client: CloudVectorProviderClient,
    providerName: string,
    typeName: string
): Promise<void> => {
    const embeddings = nodeData.inputs?.embeddings as Embeddings
    const recordManager = nodeData.inputs?.recordManager
    const store = createCloudVectorStore(nodeData, embeddings, client, providerName, typeName)

    if (recordManager) {
        const vectorStoreName = getCloudVectorRecordManagerName(nodeData, typeName)
        await recordManager.createSchema()
        scopeCloudVectorRecordManager(recordManager, vectorStoreName)
        const filterKeys: ICommonObject = {}
        if (options.docId) {
            filterKeys.docId = options.docId
        }
        const keys: string[] = await recordManager.listKeys(filterKeys)
        await store.delete({ ids: keys })
        await recordManager.deleteKeys(keys)
        return
    }

    await store.delete({ ids })
}

export const resolveCloudVectorOutput = (
    nodeData: INodeData,
    embeddings: Embeddings,
    client: CloudVectorProviderClient,
    providerName: string,
    typeName: string
): CloudVectorStore | ReturnType<CloudVectorStore['asRetriever']> => {
    const store = createCloudVectorStore(nodeData, embeddings, client, providerName, typeName)
    const output = nodeData.outputs?.output as string
    const topK = nodeData.inputs?.topK as string
    const k = topK ? parseFloat(topK) : 4
    const filter = parseOptionalJson(nodeData.inputs?.metadataFilter)

    if (output === 'retriever') {
        return store.asRetriever({
            k,
            filter
        })
    }
    ;(store as any).k = k
    ;(store as any).filter = filter
    return store
}

export const toOptions = (values: string[]): INodeOptionsValue[] => values.map((value) => ({ label: value, name: value }))

export const loadCloudVectorOptions = async (
    label: string,
    loader: () => Promise<string[]>,
    resourceName: '数据库' | '集合'
): Promise<INodeOptionsValue[]> => {
    try {
        return toOptions(await loader())
    } catch (e: any) {
        return [
            {
                label: `无法加载${label} ${resourceName}：${e?.message ?? e}`,
                name: ''
            }
        ]
    }
}
