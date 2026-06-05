import { Document } from '@langchain/core/documents'
import {
    CLOUD_VECTOR_ERROR_CODES,
    CloudVectorStore,
    chunkArray,
    normalizeCloudVectorError,
    prepareCloudVectorDocuments,
    scoreToRelevance
} from './CloudVectorStoreUtils'

const embeddings = {
    embedDocuments: jest.fn(async (texts: string[]) => texts.map((_, index) => [index + 1, index + 2, index + 3])),
    embedQuery: jest.fn(async () => [9, 8, 7])
}

describe('CloudVectorStoreUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('prepares documents with stable ids, metadata and chat isolation', () => {
        const docs = [
            new Document({
                pageContent: '合同正文',
                metadata: { source: 'contract.pdf', docId: 'doc-1' }
            }),
            new Document({
                pageContent: '',
                metadata: { docId: 'empty' }
            })
        ]

        const prepared = prepareCloudVectorDocuments(docs, {
            idField: 'id',
            textField: 'content',
            vectorField: 'vector',
            metadataField: 'metadata',
            chatId: 'chat-001'
        })

        expect(prepared).toEqual([
            {
                id: 'doc-1',
                text: '合同正文',
                metadata: {
                    source: 'contract.pdf',
                    docId: 'doc-1',
                    id: 'doc-1',
                    flowise_chatId: 'chat-001'
                }
            }
        ])
    })

    it('normalizes scores, chunks batches and maps provider errors to Chinese messages', () => {
        expect(scoreToRelevance(2, 'distance')).toBeCloseTo(1 / 3)
        expect(scoreToRelevance(0.8, 'similarity')).toBe(0.8)
        expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])

        const authError = normalizeCloudVectorError('腾讯云 VectorDB', { status: 401, message: 'Unauthorized' })
        expect(authError.code).toBe(CLOUD_VECTOR_ERROR_CODES.AUTH)
        expect(authError.message).toContain('腾讯云 VectorDB 认证失败')

        const rateLimitError = normalizeCloudVectorError('DashVector', {
            response: { status: 429, data: { message: 'Too many requests' } }
        })
        expect(rateLimitError.code).toBe(CLOUD_VECTOR_ERROR_CODES.RATE_LIMIT)
        expect(rateLimitError.message).toContain('请求过于频繁')
    })

    it('adds, searches and deletes documents through a provider client', async () => {
        const client = {
            ensureCollection: jest.fn(async () => undefined),
            upsert: jest.fn(async () => undefined),
            search: jest.fn(async () => [
                {
                    id: 'result-1',
                    text: '命中的知识片段',
                    metadata: { source: 'kb.md' },
                    score: 0.91
                }
            ]),
            delete: jest.fn(async () => undefined)
        }

        const store = new CloudVectorStore(embeddings as any, {
            providerName: '测试向量库',
            typeName: 'TestCloudVector',
            client,
            resource: { databaseName: 'db1', collectionName: 'col1' },
            fields: {
                idField: 'id',
                textField: 'content',
                vectorField: 'vector',
                metadataField: 'metadata'
            },
            autoCreate: true,
            vectorDimension: 3,
            metric: 'cosine',
            batchSize: 1,
            scoreType: 'similarity'
        })

        const ids = await store.addDocuments([
            new Document({ pageContent: '第一段', metadata: { docId: 'a' } }),
            new Document({ pageContent: '第二段', metadata: { docId: 'b' } })
        ])

        expect(ids).toEqual(['a', 'b'])
        expect(client.ensureCollection).toHaveBeenCalledWith(
            expect.objectContaining({
                databaseName: 'db1',
                collectionName: 'col1',
                vectorDimension: 3,
                metric: 'cosine',
                fields: {
                    idField: 'id',
                    textField: 'content',
                    vectorField: 'vector',
                    metadataField: 'metadata'
                }
            })
        )
        expect(client.upsert).toHaveBeenCalledTimes(2)

        const results = await store.similaritySearchVectorWithScore([1, 2, 3], 5, { tenant: 'flowops' })
        expect(results).toHaveLength(1)
        expect(results[0][0].pageContent).toBe('命中的知识片段')
        expect(results[0][0].metadata).toEqual({ source: 'kb.md', id: 'result-1' })
        expect(results[0][1]).toBe(0.91)
        expect(client.search).toHaveBeenCalledWith({
            databaseName: 'db1',
            collectionName: 'col1',
            vector: [1, 2, 3],
            topK: 5,
            filter: { tenant: 'flowops' },
            fields: {
                idField: 'id',
                textField: 'content',
                vectorField: 'vector',
                metadataField: 'metadata'
            },
            includeMetadata: true,
            includeVector: false
        })

        await store.delete({ ids: ['a', 'b'] })
        expect(client.delete).toHaveBeenCalledWith({
            databaseName: 'db1',
            collectionName: 'col1',
            ids: ['a', 'b']
        })
    })
})
