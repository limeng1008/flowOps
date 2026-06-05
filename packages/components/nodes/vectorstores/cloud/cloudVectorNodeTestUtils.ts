import { Document } from '@langchain/core/documents'

export const fakeEmbeddings = {
    embedDocuments: jest.fn(async (texts: string[]) => texts.map((_, index) => [index + 1, index + 2, index + 3])),
    embedQuery: jest.fn(async () => [0.1, 0.2, 0.3])
}

export const fakeProviderClient = {
    listDatabases: jest.fn(async () => ['default_db']),
    listCollections: jest.fn(async () => ['default_collection']),
    ensureCollection: jest.fn(async () => undefined),
    upsert: jest.fn(async () => undefined),
    search: jest.fn(async () => [
        {
            id: 'hit-1',
            text: '检索命中的内容',
            metadata: { source: 'manual.md' },
            score: 0.88
        }
    ]),
    delete: jest.fn(async () => undefined)
}

export const resetProviderClient = () => {
    jest.clearAllMocks()
}

export const createBaseNodeData = (name: string, overrides: Record<string, any> = {}) => ({
    id: `${name}_0`,
    label: name,
    name,
    type: name,
    category: 'Vector Stores',
    icon: '',
    version: 1,
    baseClasses: [],
    inputs: {
        document: [new Document({ pageContent: '知识库内容', metadata: { docId: 'doc-1', source: 'doc.md' } })],
        embeddings: fakeEmbeddings,
        databaseName: 'default_db',
        collectionName: 'default_collection',
        idField: 'id',
        textField: 'content',
        vectorField: 'vector',
        metadataField: 'metadata',
        embeddingPreset: 'text-embedding-v4',
        topK: '3',
        batchSize: '2',
        vectorDimension: '',
        metric: 'cosine',
        retryCount: '2',
        retryDelayMs: '1',
        metadataFilter: '{"source":"manual.md"}',
        autoCreate: true,
        fileUpload: true,
        includeMetadata: true,
        includeVector: false,
        ...overrides
    },
    outputs: {
        output: 'vectorStore'
    }
})

export const expectCommonNodeShape = (node: any, credentialName: string) => {
    expect(node.category).toBe('Vector Stores')
    expect(node.baseClasses).toEqual(expect.arrayContaining([node.type, 'VectorStoreRetriever', 'BaseRetriever']))
    expect(node.credential.credentialNames).toEqual([credentialName])
    expect(node.outputs.map((output: any) => output.name)).toEqual(['retriever', 'vectorStore'])
    expect(node.inputs.map((input: any) => input.name)).toEqual(
        expect.arrayContaining([
            'document',
            'embeddings',
            'databaseName',
            'collectionName',
            'idField',
            'textField',
            'vectorField',
            'metadataField',
            'embeddingPreset',
            'topK',
            'batchSize',
            'metadataFilter',
            'includeMetadata',
            'includeVector',
            'autoCreate',
            'vectorDimension',
            'metric',
            'recordManager',
            'retryCount',
            'retryDelayMs'
        ])
    )
    const metadataFilter = node.inputs.find((input: any) => input.name === 'metadataFilter')
    expect(metadataFilter.description).toContain('示例')
    expect(metadataFilter.description).toContain('自动建集合')

    const credentialHelp = node.inputs.find((input: any) => input.name === 'credentialGuide')
    expect(credentialHelp.description).toContain('开通')
    expect(credentialHelp.description).toContain('API Key')
}

export const expectNodeLifecycle = async (node: any, nodeData: any) => {
    const upsertResult = await node.vectorStoreMethods.upsert(nodeData, { chatId: 'chat-001' })
    expect(upsertResult.numAdded).toBe(1)
    expect(fakeProviderClient.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
            databaseName: 'default_db',
            collectionName: 'default_collection',
            documents: [
                expect.objectContaining({
                    id: 'doc-1',
                    text: '知识库内容',
                    vector: [1, 2, 3],
                    metadata: expect.objectContaining({ flowise_chatId: 'chat-001' })
                })
            ]
        })
    )

    const vectorStore = await node.init(nodeData, '', {})
    const results = await vectorStore.similaritySearchVectorWithScore([0.1, 0.2, 0.3], 3)
    expect(results[0][0].pageContent).toBe('检索命中的内容')
    expect(fakeProviderClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
            databaseName: 'default_db',
            collectionName: 'default_collection',
            topK: 3,
            filter: { source: 'manual.md' }
        })
    )

    await node.vectorStoreMethods.delete(nodeData, ['doc-1'], {})
    expect(fakeProviderClient.delete).toHaveBeenCalledWith(
        expect.objectContaining({
            databaseName: 'default_db',
            collectionName: 'default_collection',
            ids: ['doc-1']
        })
    )
}

export const createFakeRecordManager = () => ({
    cleanup: 'incremental',
    sourceIdKey: 'source',
    namespace: 'cloud_vector_test',
    createSchema: jest.fn(async () => undefined),
    getTime: jest.fn(async () => 100),
    exists: jest.fn(async () => [false]),
    update: jest.fn(async () => undefined),
    listKeys: jest.fn(async (): Promise<string[]> => []),
    deleteKeys: jest.fn(async () => undefined)
})
